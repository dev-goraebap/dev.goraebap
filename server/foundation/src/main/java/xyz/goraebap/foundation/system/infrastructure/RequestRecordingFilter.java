package xyz.goraebap.foundation.system.infrastructure;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerMapping;
import xyz.goraebap.foundation.system.domain.Activity;
import xyz.goraebap.foundation.system.domain.RequestSample;
import xyz.goraebap.foundation.shared.web.ClientAddress;
import xyz.goraebap.foundation.shared.web.CurrentUser;
import xyz.goraebap.foundation.shared.web.RecordedRead;
import xyz.goraebap.foundation.shared.web.TraceIdFilter;

/**
 * Records every API request in one place, so no feature writes its own: each is counted into its hour (traffic and
 * response time), and those that change something, or reads marked {@link RecordedRead}, also become an activity row.
 * It runs after the security chain has read the session, so the member is known, and puts the request into the
 * logging context (method, path, member, address) for the errors logged while it runs.
 *
 * <p>Recording only hands the record to the buffer: it never throws into the request and never waits on the store.
 * The health check and the event stream (a GET asking for text/event-stream) are left out, as the container polls one
 * and the other stays open for hours.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 10)
@RequiredArgsConstructor
class RequestRecordingFilter extends OncePerRequestFilter {
    static final String MDC_METHOD = "method";
    static final String MDC_PATH = "path";
    static final String MDC_USER = "user";
    static final String MDC_IP = "ip";

    private static final Set<String> READS = Set.of("GET", "HEAD", "OPTIONS");
    private static final String UNMATCHED = "(없는 경로)";
    private static final String TRACE_HEADER = "X-Trace-Id";
    /** A screen visit is recorded as one itself (screen_visit), not again as an activity. */
    private static final String VISITS = "/api/v1/system/visits";

    private final LogBuffer buffer;
    private final Clock clock;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/")
                || path.equals("/api/v1/health")
                // An MCP client's POST accepts an event stream too but is answered with one JSON message, so it is
                // kept.
                || request.getMethod().equals("GET")
                        && String.valueOf(request.getHeader("Accept")).contains("text/event-stream");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Instant started = clock.instant();
        long startedNanos = System.nanoTime();
        UUID user = currentUserId();
        String ip = ClientAddress.of(request);
        MDC.put(MDC_METHOD, request.getMethod());
        MDC.put(MDC_PATH, request.getRequestURI());
        MDC.put(MDC_IP, ip);
        if (user != null) MDC.put(MDC_USER, user.toString());
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_METHOD);
            MDC.remove(MDC_PATH);
            MDC.remove(MDC_IP);
            MDC.remove(MDC_USER);
            try {
                record(request, response, started, startedNanos, user, ip);
            } catch (RuntimeException ignored) {
                // A record that cannot be made is not worth failing the request for.
            }
        }
    }

    private void record(
            HttpServletRequest request,
            HttpServletResponse response,
            Instant started,
            long startedNanos,
            UUID user,
            String ip) {
        int durationMs = (int) Math.min(Integer.MAX_VALUE, (System.nanoTime() - startedNanos) / 1_000_000);
        String method = request.getMethod();
        String route = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE) instanceof String pattern
                ? pattern
                : UNMATCHED;
        int status = response.getStatus();
        buffer.offer(new RequestSample(started, method, route, status, durationMs));
        boolean recordedRead =
                request.getAttribute(HandlerMapping.BEST_MATCHING_HANDLER_ATTRIBUTE) instanceof HandlerMethod handler
                        && handler.hasMethodAnnotation(RecordedRead.class);
        if (READS.contains(method) && !recordedRead || route.equals(VISITS)) return;
        String traceId = response.getHeader(TRACE_HEADER);
        buffer.offer(new Activity(
                started,
                user != null ? user : currentUserId(),
                ip,
                method,
                route,
                target(request),
                status,
                durationMs,
                traceId != null ? traceId : String.valueOf(MDC.get(TraceIdFilter.MDC_KEY)),
                ClientAddress.agentOf(request)));
    }

    /** The mapping's path values (id=…, attachmentId=…), never the body or the query string. */
    private static String target(HttpServletRequest request) {
        if (!(request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE) instanceof Map<?, ?> values)
                || values.isEmpty()) return null;
        return cut(
                values.entrySet().stream()
                        .map(entry -> entry.getKey() + "=" + entry.getValue())
                        .collect(Collectors.joining(", ")),
                500);
    }

    private static UUID currentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getPrincipal() instanceof CurrentUser user ? user.id() : null;
    }

    private static String cut(String text, int max) {
        return text == null || text.length() <= max ? text : text.substring(0, max);
    }
}

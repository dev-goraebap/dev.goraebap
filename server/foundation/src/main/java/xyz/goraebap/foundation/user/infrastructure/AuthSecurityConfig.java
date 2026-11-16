package xyz.goraebap.foundation.user.infrastructure;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.session.NullAuthenticatedSessionStrategy;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;
import xyz.goraebap.foundation.user.application.AuthCookies;
import xyz.goraebap.foundation.user.application.AuthErrorCode;
import xyz.goraebap.foundation.user.application.AuthSettings;
import xyz.goraebap.foundation.user.application.agenttoken.AgentTokenService;
import xyz.goraebap.foundation.user.application.auth.SessionService;
import xyz.goraebap.foundation.shared.error.BusinessException;
import xyz.goraebap.foundation.shared.web.ClientAddress;
import xyz.goraebap.foundation.shared.web.CurrentUser;

@Configuration
@EnableMethodSecurity
@EnableConfigurationProperties(AuthSettings.class)
public class AuthSecurityConfig {
    /** Where browsers send and open files when they are kept on this machine (LocalObjectStorage). */
    private static final String LOCAL_STORAGE = "/api/v1/storage";

    /**
     * The MCP server (the mcp module), for agents alone: each request carries one of a member's agent tokens as a Bearer
     * token instead of the session cookie, so it needs no CSRF token, and an agent sends no Origin. Every other path
     * takes the session cookie only; a Bearer token there signs no one in.
     */
    private static final String MCP = "/api/mcp";

    private static final String HOOKS = "/api/v1/hooks/*";

    /** Device features the screens never ask for; a file input still opens the camera on phones. */
    private static final String PERMISSIONS_POLICY =
            "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()";

    @Bean
    @Order(1)
    SecurityFilterChain security(
            HttpSecurity httpSecurity,
            SessionService sessionService,
            AgentTokenService agentTokenService,
            AuthCookies authCookies,
            AuthSettings authSettings,
            Environment environment,
            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver handlerExceptionResolver)
            throws Exception {
        // hr-dev (qa) lets testers sign in as any member, as a local run does; production never does.
        boolean production = environment.acceptsProfiles(Profiles.of("prod"));
        boolean shared = environment.acceptsProfiles(Profiles.of("prod", "qa"));
        boolean development =
                environment.acceptsProfiles(Profiles.of("dev", "qa")) && !production && authSettings.devLogin();
        if (shared && !authSettings.cookieSecure()) throw new IllegalStateException("QA/prod requires secure cookies");
        if (production && authSettings.devLogin())
            throw new IllegalStateException("prod requires disabled development login");
        var csrf = new CookieCsrfTokenRepository();
        csrf.setCookieCustomizer(builder -> builder.httpOnly(true)
                .secure(authSettings.cookieSecure())
                .sameSite("Lax")
                .path("/"));
        httpSecurity
                .securityMatcher("/api/**")
                .headers(AuthSecurityConfig::headers)
                .sessionManagement(config -> config.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(config -> config.disable())
                .formLogin(config -> config.disable())
                .httpBasic(config -> config.disable())
                .logout(config -> config.disable())
                .csrf(config -> config.csrfTokenRepository(csrf)
                        .csrfTokenRequestHandler(new XorCsrfTokenRequestAttributeHandler())
                        .sessionAuthenticationStrategy(new NullAuthenticatedSessionStrategy())
                        // Local file uploads carry a signed URL, as S3's do, instead of the session.
                        .ignoringRequestMatchers(LOCAL_STORAGE, MCP, HOOKS))
                .exceptionHandling(config -> config.authenticationEntryPoint(
                                (request, response, exception) -> handlerExceptionResolver.resolveException(
                                        request, response, null, AuthErrorCode.AUTH_REQUIRED.raise()))
                        // A missing or stale CSRF token is named apart from a refusal, so a page can fetch a new
                        // token and send the command once more; a refusal would only be refused again.
                        .accessDeniedHandler(
                                (request, response, exception) -> handlerExceptionResolver.resolveException(
                                        request,
                                        response,
                                        null,
                                        (exception instanceof CsrfException
                                                        ? AuthErrorCode.AUTH_CSRF_INVALID
                                                        : AuthErrorCode.AUTH_FORBIDDEN)
                                                .raise())))
                .authorizeHttpRequests(config -> {
                    // The request was authorized when it began; the dispatch that ends a long response (an event
                    // stream) runs without the token filter and is let through.
                    config.dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll();
                    // HEAD is GET without the body (a load balancer's health check), so it is let through alike.
                    for (var method :
                            List.of(org.springframework.http.HttpMethod.GET, org.springframework.http.HttpMethod.HEAD))
                        config.requestMatchers(
                                        method,
                                        "/api/v1/health",
                                        "/api/v1/auth/csrf",
                                        LOCAL_STORAGE,
                                        "/api/openapi",
                                        "/api/openapi/**")
                                .permitAll();
                    config.requestMatchers(
                                    org.springframework.http.HttpMethod.POST,
                                    "/api/v1/auth/otp/request",
                                    "/api/v1/auth/otp/verify")
                            .permitAll();
                    config.requestMatchers(org.springframework.http.HttpMethod.PUT, LOCAL_STORAGE)
                            .permitAll();
                    // A repository's webhook carries its connection's secret instead of a session (저장소 연동).
                    config.requestMatchers(org.springframework.http.HttpMethod.POST, HOOKS)
                            .permitAll();
                    if (development)
                        config.requestMatchers("/api/v1/auth/dev/members", "/api/v1/auth/dev/login")
                                .permitAll();
                    else config.requestMatchers("/api/v1/auth/dev/**").denyAll();
                    config.anyRequest().authenticated();
                });
        httpSecurity.addFilterBefore(
                new OncePerRequestFilter() {
                    @Override
                    protected void doFilterInternal(
                            HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                            throws ServletException, IOException {
                        response.setHeader("Cache-Control", "no-store");
                        if (MCP.equals(request.getRequestURI())) {
                            agent(request, response, chain);
                            return;
                        }
                        if (!Set.of("GET", "HEAD", "OPTIONS").contains(request.getMethod())
                                && !LOCAL_STORAGE.equals(request.getRequestURI())
                                // A repository's host sends no Origin; its delivery carries its connection's secret.
                                && !request.getRequestURI().startsWith("/api/v1/hooks/")
                                && (request.getHeader("Origin") == null
                                        || !authSettings.allowedOrigins().contains(request.getHeader("Origin")))) {
                            handlerExceptionResolver.resolveException(
                                    request, response, null, AuthErrorCode.AUTH_FORBIDDEN.raise());
                            return;
                        }
                        try {
                            String token = authCookies.read(request);
                            var authenticated = sessionService.authenticate(token);
                            if (authenticated.isPresent()) {
                                var user = authenticated.get();
                                signIn(user);
                                authCookies.write(response, token, user.expiresAt());
                            } else if (token != null) authCookies.clear(response);
                            chain.doFilter(request, response);
                        } catch (BusinessException exception) {
                            handlerExceptionResolver.resolveException(request, response, null, exception);
                        } finally {
                            SecurityContextHolder.clearContext();
                        }
                    }

                    /**
                     * An agent's request to the MCP server: one of a member's agent tokens signs the member in for this request alone.
                     * A page of another site may not call it from a browser (an Origin, when one is sent, must be ours), and a missing,
                     * unknown, expired or revoked token is 401 with the Bearer challenge.
                     */
                    private void agent(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                            throws ServletException, IOException {
                        try {
                            String origin = request.getHeader("Origin");
                            if (origin != null && !authSettings.allowedOrigins().contains(origin))
                                throw AuthErrorCode.AUTH_FORBIDDEN.raise();
                            var agent = bearer(request)
                                    .flatMap(secret ->
                                            agentTokenService.authenticate(secret, ClientAddress.of(request)));
                            if (agent.isEmpty()) {
                                response.setHeader("WWW-Authenticate", "Bearer realm=\"api\"");
                                throw AuthErrorCode.AUTH_REQUIRED.raise();
                            }
                            signIn(agent.get());
                            chain.doFilter(request, response);
                        } catch (BusinessException exception) {
                            handlerExceptionResolver.resolveException(request, response, null, exception);
                        } finally {
                            SecurityContextHolder.clearContext();
                        }
                    }
                },
                CsrfFilter.class);
        return httpSecurity.build();
    }

    /**
     * Everything outside /api/ is the built screens and their files (ScreenConfig): public, without a session, and
     * with nothing that changes state.
     */
    @Bean
    @Order(2)
    SecurityFilterChain screens(HttpSecurity httpSecurity) throws Exception {
        return httpSecurity
                .headers(AuthSecurityConfig::headers)
                .sessionManagement(config -> config.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(config -> config.disable())
                .formLogin(config -> config.disable())
                .httpBasic(config -> config.disable())
                .logout(config -> config.disable())
                .csrf(config -> config.disable())
                .authorizeHttpRequests(config -> config.anyRequest().permitAll())
                .build();
    }

    /**
     * Spring Security's defaults (nosniff, frame DENY, HSTS over HTTPS) plus two: other sites see only the origin a
     * link came from, never a path that names a member or a request, and the page gives up device features it never
     * uses. A Content-Security-Policy is left for its own change, since the built screens' scripts and styles have to be
     * listed first.
     */
    /** Signs the member in for this request; each role is an authority of its own name, none implying another. */
    private static void signIn(CurrentUser user) {
        SecurityContextHolder.getContext()
                .setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                        user,
                        null,
                        user.roles().stream()
                                .map(role -> new SimpleGrantedAuthority(role.name()))
                                .toList()));
    }

    /** The token of the request's one Authorization header when it is a Bearer one. */
    private static Optional<String> bearer(HttpServletRequest request) {
        var headers = Collections.list(request.getHeaders("Authorization"));
        if (headers.size() != 1) return Optional.empty();
        String value = headers.getFirst();
        return value.regionMatches(true, 0, "Bearer ", 0, 7)
                ? Optional.of(value.substring(7).strip())
                : Optional.empty();
    }

    private static void headers(HeadersConfigurer<HttpSecurity> headers) {
        headers.referrerPolicy(config -> config.policy(ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .permissionsPolicyHeader(config -> config.policy(PERMISSIONS_POLICY));
    }
}

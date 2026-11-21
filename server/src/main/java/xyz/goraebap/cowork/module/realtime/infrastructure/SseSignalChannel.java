package xyz.goraebap.cowork.module.realtime.infrastructure;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import xyz.goraebap.cowork.module.realtime.Signal;
import xyz.goraebap.cowork.module.realtime.application.port.SignalChannel;

/**
 * The open streams of this server, held in memory by member. A stream ends after a while so dead connections do not
 * pile up, and the browser opens a new one; in between a comment keeps proxies from closing it. A stream that fails
 * to take an event is dropped.
 */
@Slf4j
@Component
class SseSignalChannel implements SignalChannel {
    private static final Duration LIFETIME = Duration.ofMinutes(30);
    private static final Duration RECONNECT = Duration.ofSeconds(3);
    /** A member with more screens open than this has left some behind; the oldest give way. */
    private static final int SCREENS_MAX = 10;

    private final Map<UUID, Set<SseEmitter>> streams = new ConcurrentHashMap<>();
    /** Members whose latest stream was opened as an administrator. */
    private final Set<UUID> administrators = ConcurrentHashMap.newKeySet();

    @Override
    public SseEmitter open(UUID member, boolean admin) {
        return attach(member, admin, new SseEmitter(LIFETIME.toMillis()));
    }

    /** Holds the screen's stream for the member and greets it; the stream is opened by open, or by a test. */
    SseEmitter attach(UUID member, boolean admin, SseEmitter emitter) {
        if (admin) administrators.add(member);
        else administrators.remove(member);
        var own = streams.computeIfAbsent(member, key -> new CopyOnWriteArraySet<>());
        own.add(emitter);
        emitter.onCompletion(() -> drop(member, emitter));
        emitter.onTimeout(emitter::complete);
        emitter.onError(error -> drop(member, emitter));
        if (own.size() > SCREENS_MAX) own.stream().findFirst().ifPresent(SseEmitter::complete);
        write(
                member,
                emitter,
                SseEmitter.event().reconnectTime(RECONNECT.toMillis()).comment("connected"));
        return emitter;
    }

    @Override
    public void send(Signal signal) {
        var data = Map.of("topic", signal.topic().name(), "id", signal.id().toString());
        streams.forEach((member, own) -> {
            if (!signal.reaches(member, administrators.contains(member))) return;
            for (var emitter : own)
                write(member, emitter, SseEmitter.event().name("signal").data(data, MediaType.APPLICATION_JSON));
        });
    }

    /** A comment every so often, below the idle limits of common proxies, which also finds streams gone dead. */
    @Scheduled(fixedDelay = 25_000)
    void keepAlive() {
        streams.forEach((member, own) ->
                own.forEach(emitter -> write(member, emitter, SseEmitter.event().comment("alive"))));
    }

    private void write(UUID member, SseEmitter emitter, SseEmitter.SseEventBuilder event) {
        try {
            emitter.send(event);
        } catch (IOException | IllegalStateException e) {
            // The screen went away; its stream is closed and forgotten.
            log.debug("Dropping a closed event stream: {}", e.getMessage());
            drop(member, emitter);
            close(emitter, e);
        }
    }

    /**
     * Ends a stream that failed to take an event, so its request is not held until it times out. The container may
     * have ended it already (the phone closed the connection and its error was handled first), and it then refuses to
     * end it again; nothing is left to do, and the other streams still get their event.
     */
    private static void close(SseEmitter emitter, Exception cause) {
        try {
            emitter.completeWithError(cause);
        } catch (IllegalStateException alreadyEnded) {
            log.debug("The event stream had already ended: {}", alreadyEnded.getMessage());
        }
    }

    private void drop(UUID member, SseEmitter emitter) {
        streams.computeIfPresent(member, (key, own) -> {
            own.remove(emitter);
            if (own.isEmpty()) administrators.remove(key);
            return own.isEmpty() ? null : own;
        });
    }
}

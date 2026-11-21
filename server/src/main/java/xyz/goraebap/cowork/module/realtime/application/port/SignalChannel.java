package xyz.goraebap.cowork.module.realtime.application.port;

import java.util.UUID;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import xyz.goraebap.cowork.module.realtime.Signal;

/**
 * Where signals travel to the members' screens. The server keeps the open streams itself while it runs as one
 * instance; several instances would put a relay between them (a message broker, say) behind this port.
 */
public interface SignalChannel {

    /** A new stream for one of the member's screens; admin says whether signals for administrators reach it. */
    SseEmitter open(UUID member, boolean admin);

    /** Sends the signal to the open streams of those it reaches. */
    void send(Signal signal);
}

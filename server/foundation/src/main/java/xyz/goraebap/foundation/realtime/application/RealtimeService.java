package xyz.goraebap.foundation.realtime.application;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import xyz.goraebap.foundation.realtime.RealtimeFacade;
import xyz.goraebap.foundation.realtime.Signal;
import xyz.goraebap.foundation.realtime.application.port.SignalChannel;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/**
 * Signals are handed to the application's events and leave from SignalDelivery once the caller's transaction commits,
 * so a change that rolls back tells no one. Neither method writes; they only join a transaction when there is one.
 */
@Service
@RequiredArgsConstructor
public class RealtimeService implements RealtimeFacade {
    private final ApplicationEventPublisher events;
    private final SignalChannel signalChannel;

    @Override
    @Transactional(propagation = Propagation.SUPPORTS)
    public void signal(Signal signal) {
        events.publishEvent(signal);
    }

    /** A stream of signals for one of the member's screens. */
    @Transactional(propagation = Propagation.SUPPORTS)
    public SseEmitter connect(CurrentUser user) {
        return signalChannel.open(user.id(), user.instanceAdmin());
    }
}

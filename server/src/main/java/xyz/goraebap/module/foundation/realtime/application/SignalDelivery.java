package xyz.goraebap.module.foundation.realtime.application;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import xyz.goraebap.module.foundation.realtime.Signal;
import xyz.goraebap.module.foundation.realtime.application.port.SignalChannel;

/** Sends a signal once the transaction it was raised in commits, or at once when it was raised outside one. */
@Component
@RequiredArgsConstructor
class SignalDelivery {
    private final SignalChannel signalChannel;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    void deliver(Signal signal) {
        signalChannel.send(signal);
    }
}

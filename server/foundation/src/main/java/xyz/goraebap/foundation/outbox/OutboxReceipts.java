package xyz.goraebap.foundation.outbox;

import static xyz.goraebap.foundation.jooq.tables.OutboxReceived.OUTBOX_RECEIVED;

import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Which lines the foundation's handlers have already carried out. A handler asks inside the transaction that does the
 * work, so the note and the work are kept together: a line handed over again after a crash finds its note and does
 * nothing.
 */
@Component
@RequiredArgsConstructor
public class OutboxReceipts {
    private final DSLContext dslContext;
    private final Clock clock;

    /** True the first time the line is seen; the caller then does the work in the same transaction. */
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean first(OutboxMessage message) {
        return dslContext
                        .insertInto(OUTBOX_RECEIVED)
                        .set(OUTBOX_RECEIVED.CHANNEL, message.channel())
                        .set(OUTBOX_RECEIVED.OUTBOX_ID, Math.toIntExact(message.id()))
                        .set(OUTBOX_RECEIVED.RECEIVED_AT, clock.instant())
                        .onConflictDoNothing()
                        .execute()
                == 1;
    }
}

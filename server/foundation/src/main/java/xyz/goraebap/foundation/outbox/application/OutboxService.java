package xyz.goraebap.foundation.outbox.application;

import java.time.Clock;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.foundation.outbox.Outbox;
import xyz.goraebap.foundation.outbox.domain.OutboxRepository;

/** Takes lines in, and lets an administrator see the ones that failed, try them again or drop them. */
@Service
@RequiredArgsConstructor
public class OutboxService implements Outbox {
    private static final int FAILED_SHOWN = 200;
    private static final int TOPIC_MAX = 64;
    private static final int KEY_MAX = 200;

    private final OutboxRepository outboxRepository;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    /** MANDATORY: a line written outside the command's transaction could outlive a command that rolled back. */
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void add(String topic, String orderingKey, String payload) {
        if (topic == null || topic.isBlank() || topic.length() > TOPIC_MAX)
            throw new IllegalArgumentException("outbox topic must be 1 to " + TOPIC_MAX + " characters");
        if (orderingKey != null && (orderingKey.isBlank() || orderingKey.length() > KEY_MAX))
            throw new IllegalArgumentException("outbox ordering key must be 1 to " + KEY_MAX + " characters");
        if (payload == null) throw new IllegalArgumentException("outbox payload is required");
        outboxRepository.add(topic, orderingKey, payload, clock.instant());
        events.publishEvent(new OutboxAdded());
    }

    @Transactional(readOnly = true)
    public List<OutboxViews.FailedLine> failed() {
        return outboxRepository.findFailed(FAILED_SHOWN).stream()
                .map(line -> new OutboxViews.FailedLine(
                        line.id(),
                        line.topic(),
                        line.orderingKey(),
                        line.attempts(),
                        line.lastError(),
                        line.createdAt(),
                        line.failedAt()))
                .toList();
    }

    /** A failed line starts over from its first attempt; the lines waiting behind it follow once it is done. */
    @Transactional
    public void retry(long id) {
        requireFailed(id);
        outboxRepository.reopen(id, clock.instant());
        events.publishEvent(new OutboxAdded());
    }

    /** Drops a failed line for good, which lets the lines waiting behind it go on. */
    @Transactional
    public void discard(long id) {
        requireFailed(id);
        outboxRepository.delete(id);
        events.publishEvent(new OutboxAdded());
    }

    private void requireFailed(long id) {
        String status = outboxRepository.statusOf(id).orElseThrow(OutboxErrorCode.OUTBOX_NOT_FOUND::raise);
        if (!status.equals("FAILED")) throw OutboxErrorCode.OUTBOX_NOT_FAILED.raise();
    }

    /** Lines were added or freed in the transaction that publishes this; the processor looks once it commits. */
    record OutboxAdded() {}
}

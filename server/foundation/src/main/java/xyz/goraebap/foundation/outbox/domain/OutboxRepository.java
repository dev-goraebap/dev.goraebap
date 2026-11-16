package xyz.goraebap.foundation.outbox.domain;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import xyz.goraebap.foundation.outbox.OutboxMessage;

public interface OutboxRepository {
    void add(String topic, String orderingKey, String payload, Instant now);

    /**
     * Pending lines whose time has come, oldest first, leaving out any whose orderingKey has an earlier line still
     * unfinished (pending or failed).
     */
    List<OutboxMessage> findDue(Instant now, int limit);

    void markDone(long id, Instant now);

    void markRetry(long id, int attempts, Instant nextAttemptAt, String error);

    void markFailed(long id, int attempts, String error, Instant now);

    List<FailedLine> findFailed(int limit);

    Optional<String> statusOf(long id);

    /** Makes a failed line pending again from its first attempt. */
    void reopen(long id, Instant now);

    void delete(long id);

    void deleteDoneBefore(Instant moment);

    record FailedLine(
            long id,
            String topic,
            String orderingKey,
            int attempts,
            String lastError,
            Instant createdAt,
            Instant failedAt) {}
}

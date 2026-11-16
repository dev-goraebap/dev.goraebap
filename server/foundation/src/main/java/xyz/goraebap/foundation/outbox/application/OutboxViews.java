package xyz.goraebap.foundation.outbox.application;

import java.time.Instant;

public final class OutboxViews {
    private OutboxViews() {}

    /** A line that failed: what it was for, how often it was tried and what went wrong last. Never its payload. */
    public record FailedLine(
            long id,
            String topic,
            String orderingKey,
            int attempts,
            String lastError,
            Instant createdAt,
            Instant failedAt) {}
}

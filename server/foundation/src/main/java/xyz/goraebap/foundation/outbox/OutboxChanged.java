package xyz.goraebap.foundation.outbox;

/** Lines were added or freed in the transaction that publishes this; the processor looks once it commits. */
public record OutboxChanged() {}

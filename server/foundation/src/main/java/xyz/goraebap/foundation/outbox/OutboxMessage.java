package xyz.goraebap.foundation.outbox;

/** One line as its handler receives it. The id stays the same across attempts, so a handler can tell a repeat. */
public record OutboxMessage(long id, String topic, String orderingKey, String payload, int attempts) {}

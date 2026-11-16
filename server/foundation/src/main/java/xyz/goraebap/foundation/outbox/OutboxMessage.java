package xyz.goraebap.foundation.outbox;

/**
 * One line as its handler receives it. The channel and the id together stay the same across attempts, so a handler
 * can tell a repeat (OutboxReceipts).
 */
public record OutboxMessage(String channel, long id, String topic, String orderingKey, String payload, int attempts) {}

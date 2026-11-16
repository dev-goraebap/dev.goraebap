package xyz.goraebap.foundation.outbox;

/**
 * Where a command leaves what another subproject must do because of it. The line is written in the caller's own
 * transaction, so it is kept exactly when the command is; after the commit the processor hands it to the topic's
 * handler, again while that fails for a passing reason. A command writes only to its own database, and this is how
 * the rest follows.
 */
public interface Outbox {
    /**
     * Adds a line inside the running transaction; without one it refuses. Lines with the same orderingKey are handled
     * in the order they were added, a later one waiting while an earlier one is unfinished; null asks for no order.
     */
    void add(String topic, String orderingKey, String payload);
}

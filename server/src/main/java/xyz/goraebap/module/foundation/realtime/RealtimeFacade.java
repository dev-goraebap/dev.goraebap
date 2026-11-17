package xyz.goraebap.module.foundation.realtime;

/**
 * Tells the members' open screens that something changed. Called inside the change's transaction, the signal leaves
 * only after it commits and never when it rolls back; called outside one, it leaves at once. Delivery is best effort:
 * a screen that was not connected catches up when it reconnects.
 */
public interface RealtimeFacade {
    void signal(Signal signal);
}

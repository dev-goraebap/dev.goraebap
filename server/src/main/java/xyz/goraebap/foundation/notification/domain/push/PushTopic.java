package xyz.goraebap.foundation.notification.domain.push;

import java.util.Optional;

/**
 * The groups of notices a member may turn off for push, read from a notice's kind: notices about work items
 * (ISSUE_ASSIGNED and the like). A kind in none of them is always pushed.
 */
public enum PushTopic {
    WORK_ITEM;

    public static Optional<PushTopic> of(String kind) {
        if (kind != null && kind.startsWith("ISSUE_")) return Optional.of(WORK_ITEM);
        return Optional.empty();
    }
}

package xyz.goraebap.module.foundation.notification.domain.push;

import java.util.Optional;

/**
 * The groups of notices a member may turn off for push, read from the end of a notice's kind: a request waiting for
 * them, the outcome of a request (approved, rejected, cancelled), a copy of someone's request, announcements, and
 * calendar events they are in (invited, changed, removed, reminded).
 * A kind in none of them is always pushed.
 */
public enum PushTopic {
    APPROVAL_REQUEST,
    APPROVAL_RESULT,
    COPY,
    ANNOUNCEMENT,
    CALENDAR;

    public static Optional<PushTopic> of(String kind) {
        if (kind == null) return Optional.empty();
        if (kind.startsWith("ANNOUNCEMENT_")) return Optional.of(ANNOUNCEMENT);
        if (kind.startsWith("EVENT_")) return Optional.of(CALENDAR);
        if (kind.endsWith("_SUBMITTED") || kind.endsWith("_PENDING")) return Optional.of(APPROVAL_REQUEST);
        if (kind.endsWith("_CC")) return Optional.of(COPY);
        if (kind.endsWith("_APPROVED") || kind.endsWith("_REJECTED") || kind.endsWith("_CANCELLED"))
            return Optional.of(APPROVAL_RESULT);
        return Optional.empty();
    }
}

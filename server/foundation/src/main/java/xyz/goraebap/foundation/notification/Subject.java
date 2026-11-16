package xyz.goraebap.foundation.notification;

import java.util.Objects;
import java.util.UUID;

/**
 * The one thing a notice is about: a published notice, an approval request, a calendar event. Notices about the same
 * thing are settled together, whichever of them the member opened and however they reached the thing itself.
 */
public record Subject(Type type, UUID id) {
    public enum Type {
        ANNOUNCEMENT,
        APPROVAL_REQUEST,
        /** The requests waiting for one approver's decision, all together; its id is the approver's. */
        APPROVAL_INBOX,
        CALENDAR_EVENT,
        MEETING,
        /** A project's issue. */
        ISSUE
    }

    public Subject {
        Objects.requireNonNull(type, "type");
        Objects.requireNonNull(id, "id");
    }

    public static Subject announcement(UUID id) {
        return new Subject(Type.ANNOUNCEMENT, id);
    }

    public static Subject approvalRequest(UUID id) {
        return new Subject(Type.APPROVAL_REQUEST, id);
    }

    public static Subject approvalInbox(UUID approverId) {
        return new Subject(Type.APPROVAL_INBOX, approverId);
    }

    public static Subject calendarEvent(UUID id) {
        return new Subject(Type.CALENDAR_EVENT, id);
    }

    public static Subject issue(UUID id) {
        return new Subject(Type.ISSUE, id);
    }
}

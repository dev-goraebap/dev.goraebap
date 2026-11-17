package xyz.goraebap.module.foundation.notification.application;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Objects;
import java.util.UUID;
import xyz.goraebap.module.foundation.notification.Subject;

public final class NotificationRequests {
    private NotificationRequests() {}

    /** The member opened a subject. Explicit reads may also clear its actionable notices. */
    public record Seen(@NotNull String type, @NotNull UUID id, Boolean includeActionable) {}

    /**
     * The member's notices, newest first, searched in their title and message and narrowed by read state and by what
     * they are about, a slice at a time.
     */
    public record NotificationListing(
            @Size(max = 100) String q,
            ReadState read,
            Category category,
            @Size(max = 1000) String cursor,
            @Min(1) @Max(MAX_SIZE) Integer size) {
        public static final int DEFAULT_SIZE = 20;
        public static final int MAX_SIZE = 100;

        public NotificationListing {
            q = q == null || q.isBlank() ? null : q.strip();
            cursor = cursor == null || cursor.isBlank() ? null : cursor;
            size = Objects.requireNonNullElse(size, DEFAULT_SIZE);
        }
    }

    public enum ReadState {
        UNREAD,
        READ
    }

    public enum Category {
        APPROVAL,
        ANNOUNCEMENT,
        EVENT
    }
}

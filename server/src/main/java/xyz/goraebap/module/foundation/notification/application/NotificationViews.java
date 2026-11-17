package xyz.goraebap.module.foundation.notification.application;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class NotificationViews {
    private NotificationViews() {}

    /** One notice; actorId and actorName name the member whose act it reports, absent on notices from before them. */
    public record NotificationItem(
            UUID id,
            String kind,
            UUID actorId,
            String actorName,
            String title,
            String message,
            String link,
            Instant createdAt,
            Instant readAt) {}

    /** One slice of the member's notices; nextCursor reads the slice after it and is absent at the end. */
    public record NotificationSlice(List<NotificationItem> items, String nextCursor) {
        public NotificationSlice {
            items = List.copyOf(items);
        }
    }

    public record UnreadNotifications(long count) {}

    /** A stored notice with its actor's name left to attach. */
    public record Row(
            UUID id,
            String kind,
            UUID actorId,
            String title,
            String message,
            String link,
            Instant createdAt,
            Instant readAt) {}

    public record RowSlice(List<Row> rows, String nextCursor) {
        public RowSlice {
            rows = List.copyOf(rows);
        }
    }
}

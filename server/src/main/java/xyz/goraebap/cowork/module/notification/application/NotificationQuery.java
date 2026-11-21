package xyz.goraebap.cowork.module.notification.application;

import java.util.UUID;

public interface NotificationQuery {
    /** One slice of the member's notices under the listing, newest first. */
    NotificationViews.RowSlice findByRecipient(UUID recipientId, NotificationRequests.NotificationListing listing);

    long countUnread(UUID recipientId);
}

package xyz.goraebap.foundation.notification.infrastructure;

import static xyz.goraebap.jooq.tables.NotificationEvent.NOTIFICATION_EVENT;
import static xyz.goraebap.jooq.tables.NotificationRecipient.NOTIFICATION_RECIPIENT;

import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.foundation.notification.application.NotificationQuery;
import xyz.goraebap.foundation.notification.application.NotificationRequests;
import xyz.goraebap.foundation.notification.application.NotificationViews;
import xyz.goraebap.shared.web.Cursor;

@Repository
@RequiredArgsConstructor
class JooqNotificationQuery implements NotificationQuery {
    private static final String SORT = "LATEST";

    private final DSLContext dslContext;

    /**
     * One slice after the cursor, read one row long to know whether another follows. The cursor holds the time and id
     * of the last notice; the id breaks ties between notices of the same instant.
     */
    public NotificationViews.RowSlice findByRecipient(
            UUID recipientId, NotificationRequests.NotificationListing listing) {
        Condition condition =
                NOTIFICATION_RECIPIENT.RECIPIENT_ID.eq(recipientId).and(visibleNotice());
        if (listing.q() != null)
            condition = condition.and(NOTIFICATION_EVENT
                    .TITLE
                    .containsIgnoreCase(listing.q())
                    .or(NOTIFICATION_EVENT.MESSAGE.containsIgnoreCase(listing.q())));
        if (listing.read() != null)
            condition = condition.and(
                    listing.read() == NotificationRequests.ReadState.UNREAD
                            ? NOTIFICATION_RECIPIENT.READ_AT.isNull()
                            : NOTIFICATION_RECIPIENT.READ_AT.isNotNull());
        if (listing.cursor() != null) {
            var last = Cursor.decode(listing.cursor(), SORT, 2);
            condition = condition.and(DSL.row(NOTIFICATION_EVENT.CREATED_AT, NOTIFICATION_EVENT.EVENT_ID)
                    .lt(moment(last.get(0)), uuid(last.get(1))));
        }
        var rows = dslContext
                .select(
                        NOTIFICATION_EVENT.EVENT_ID,
                        NOTIFICATION_EVENT.KIND,
                        NOTIFICATION_EVENT.ACTOR_ID,
                        NOTIFICATION_EVENT.TITLE,
                        NOTIFICATION_EVENT.MESSAGE,
                        NOTIFICATION_EVENT.LINK,
                        NOTIFICATION_EVENT.CREATED_AT,
                        NOTIFICATION_RECIPIENT.READ_AT)
                .from(NOTIFICATION_RECIPIENT)
                .join(NOTIFICATION_EVENT)
                .on(NOTIFICATION_EVENT.EVENT_ID.eq(NOTIFICATION_RECIPIENT.EVENT_ID))
                .where(condition)
                .orderBy(NOTIFICATION_EVENT.CREATED_AT.desc(), NOTIFICATION_EVENT.EVENT_ID.desc())
                .limit(listing.size() + 1)
                .fetch(row -> new NotificationViews.Row(
                        row.value1(),
                        row.value2(),
                        row.value3(),
                        row.value4(),
                        row.value5(),
                        row.value6(),
                        row.value7(),
                        row.value8()));
        if (rows.size() <= listing.size()) return new NotificationViews.RowSlice(rows, null);
        var shown = rows.subList(0, listing.size());
        var end = shown.getLast();
        return new NotificationViews.RowSlice(
                shown, Cursor.encode(SORT, end.createdAt().toString(), end.id().toString()));
    }

    public long countUnread(UUID recipientId) {
        return dslContext.fetchCount(dslContext
                .selectOne()
                .from(NOTIFICATION_RECIPIENT)
                .join(NOTIFICATION_EVENT)
                .on(NOTIFICATION_EVENT.EVENT_ID.eq(NOTIFICATION_RECIPIENT.EVENT_ID))
                .where(NOTIFICATION_RECIPIENT.RECIPIENT_ID.eq(recipientId))
                .and(NOTIFICATION_RECIPIENT.READ_AT.isNull())
                .and(visibleNotice()));
    }

    private static Condition visibleNotice() {
        return NOTIFICATION_EVENT.KIND.ne("AI_NOTE_READY");
    }

    private static Instant moment(String value) {
        try {
            return Instant.parse(value);
        } catch (RuntimeException e) {
            throw Cursor.invalid();
        }
    }

    private static UUID uuid(String value) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException e) {
            throw Cursor.invalid();
        }
    }
}

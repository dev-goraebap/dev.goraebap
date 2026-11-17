package xyz.goraebap.module.foundation.notification.infrastructure;

import static xyz.goraebap.jooq.tables.NotificationEvent.NOTIFICATION_EVENT;
import static xyz.goraebap.jooq.tables.NotificationRecipient.NOTIFICATION_RECIPIENT;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.module.foundation.notification.application.NotificationQuery;
import xyz.goraebap.module.foundation.notification.application.NotificationRequests;
import xyz.goraebap.module.foundation.notification.application.NotificationViews;
import xyz.goraebap.shared.web.Cursor;

@Repository
@RequiredArgsConstructor
class JooqNotificationQuery implements NotificationQuery {
    /** Kinds of notices about new announcements. */
    private static final String ANNOUNCEMENT_PREFIX = "ANNOUNCEMENT_";

    /** Kinds of notices about calendar events: invited, changed, removed and reminded. */
    private static final String EVENT_PREFIX = "EVENT_";

    /**
     * How the kinds of notices about approval requests end ({KIND}_SUBMITTED and the like). Calendar notices are in
     * neither group and show only when no group is chosen.
     */
    private static final List<String> APPROVAL_SUFFIXES =
            List.of("_SUBMITTED", "_PENDING", "_CC", "_APPROVED", "_REJECTED", "_CANCELLED");

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
        if (listing.category() != null)
            condition = condition.and(
                    switch (listing.category()) {
                        case ANNOUNCEMENT -> NOTIFICATION_EVENT.KIND.startsWith(ANNOUNCEMENT_PREFIX);
                        case EVENT -> NOTIFICATION_EVENT.KIND.startsWith(EVENT_PREFIX);
                        case APPROVAL -> approval();
                    });
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

    /** A notice about an approval request: not an announcement or calendar one, and ending as approval kinds do. */
    private static Condition approval() {
        return DSL.not(NOTIFICATION_EVENT.KIND.startsWith(ANNOUNCEMENT_PREFIX))
                .and(DSL.not(NOTIFICATION_EVENT.KIND.startsWith(EVENT_PREFIX)))
                .and(DSL.or(APPROVAL_SUFFIXES.stream()
                        .map(NOTIFICATION_EVENT.KIND::endsWith)
                        .toList()));
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

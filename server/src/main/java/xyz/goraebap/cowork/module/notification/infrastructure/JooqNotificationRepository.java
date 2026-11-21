package xyz.goraebap.cowork.module.notification.infrastructure;

import static xyz.goraebap.cowork.jooq.tables.NotificationEvent.NOTIFICATION_EVENT;
import static xyz.goraebap.cowork.jooq.tables.NotificationRecipient.NOTIFICATION_RECIPIENT;

import java.time.Instant;
import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.cowork.module.notification.Notice;
import xyz.goraebap.cowork.module.notification.Subject;
import xyz.goraebap.cowork.module.notification.domain.NotificationRepository;

@Repository
@RequiredArgsConstructor
class JooqNotificationRepository implements NotificationRepository {
    private static final int TITLE_MAX = 200;
    private static final int LINK_MAX = 500;

    private final DSLContext dslContext;

    public void save(UUID id, Notice notice, Instant now) {
        if (notice.ends() == Notice.Ends.SEEN)
            markUnread(
                    NOTIFICATION_RECIPIENT.RECIPIENT_ID.in(notice.recipients()),
                    about(notice.subject()).and(NOTIFICATION_EVENT.ENDS.eq(Notice.Ends.SEEN.name())),
                    now);
        dslContext
                .insertInto(NOTIFICATION_EVENT)
                .set(NOTIFICATION_EVENT.EVENT_ID, id)
                .set(NOTIFICATION_EVENT.KIND, notice.kind())
                .set(NOTIFICATION_EVENT.ACTOR_ID, notice.actorId())
                .set(NOTIFICATION_EVENT.TITLE, cut(notice.title(), TITLE_MAX))
                .set(NOTIFICATION_EVENT.MESSAGE, notice.message() == null ? "" : notice.message())
                .set(NOTIFICATION_EVENT.LINK, notice.link() == null ? null : cut(notice.link(), LINK_MAX))
                .set(NOTIFICATION_EVENT.SUBJECT_TYPE, notice.subject().type().name())
                .set(NOTIFICATION_EVENT.SUBJECT_ID, notice.subject().id())
                .set(NOTIFICATION_EVENT.ENDS, notice.ends().name())
                .set(NOTIFICATION_EVENT.EXPIRES_AT, notice.expiresAt())
                .set(NOTIFICATION_EVENT.CREATED_AT, now)
                .execute();
        for (var recipient : notice.recipients())
            dslContext
                    .insertInto(NOTIFICATION_RECIPIENT)
                    .set(NOTIFICATION_RECIPIENT.EVENT_ID, id)
                    .set(NOTIFICATION_RECIPIENT.RECIPIENT_ID, recipient)
                    .onConflictDoNothing()
                    .execute();
    }

    public boolean markRead(UUID id, UUID recipientId, Instant now) {
        var owned = dslContext.fetchExists(
                NOTIFICATION_RECIPIENT,
                NOTIFICATION_RECIPIENT.EVENT_ID.eq(id).and(NOTIFICATION_RECIPIENT.RECIPIENT_ID.eq(recipientId)));
        if (!owned) return false;
        dslContext
                .update(NOTIFICATION_RECIPIENT)
                .set(NOTIFICATION_RECIPIENT.READ_AT, now)
                .where(NOTIFICATION_RECIPIENT.EVENT_ID.eq(id))
                .and(NOTIFICATION_RECIPIENT.RECIPIENT_ID.eq(recipientId))
                .and(NOTIFICATION_RECIPIENT.READ_AT.isNull())
                .execute();
        return true;
    }

    public void markAllRead(UUID recipientId, Instant now) {
        dslContext
                .update(NOTIFICATION_RECIPIENT)
                .set(NOTIFICATION_RECIPIENT.READ_AT, now)
                .where(NOTIFICATION_RECIPIENT.RECIPIENT_ID.eq(recipientId))
                .and(NOTIFICATION_RECIPIENT.READ_AT.isNull())
                .execute();
    }

    public int markReadAbout(UUID recipientId, Subject subject, Notice.Ends ends, Instant now) {
        var events = ends == null ? about(subject) : about(subject).and(NOTIFICATION_EVENT.ENDS.eq(ends.name()));
        return markUnread(NOTIFICATION_RECIPIENT.RECIPIENT_ID.eq(recipientId), events, now);
    }

    public Set<UUID> markReadAbout(Subject subject, Instant now) {
        return markUnreadOf(about(subject), now);
    }

    public Set<UUID> markExpired(Instant now) {
        return markUnreadOf(NOTIFICATION_EVENT.EXPIRES_AT.le(now), now);
    }

    private static Condition about(Subject subject) {
        return NOTIFICATION_EVENT
                .SUBJECT_TYPE
                .eq(subject.type().name())
                .and(NOTIFICATION_EVENT.SUBJECT_ID.eq(subject.id()));
    }

    /** Marks read the unread rows of the recipients chosen whose notice matches events; returns how many. */
    private int markUnread(Condition recipients, Condition events, Instant now) {
        return dslContext
                .update(NOTIFICATION_RECIPIENT)
                .set(NOTIFICATION_RECIPIENT.READ_AT, now)
                .where(recipients)
                .and(NOTIFICATION_RECIPIENT.READ_AT.isNull())
                .and(NOTIFICATION_RECIPIENT.EVENT_ID.in(dslContext
                        .select(NOTIFICATION_EVENT.EVENT_ID)
                        .from(NOTIFICATION_EVENT)
                        .where(events)))
                .execute();
    }

    /** Marks read everyone's unread rows whose notice matches events; returns whose they were. */
    private Set<UUID> markUnreadOf(Condition events, Instant now) {
        Collection<UUID> whose = dslContext
                .selectDistinct(NOTIFICATION_RECIPIENT.RECIPIENT_ID)
                .from(NOTIFICATION_RECIPIENT)
                .join(NOTIFICATION_EVENT)
                .on(NOTIFICATION_EVENT.EVENT_ID.eq(NOTIFICATION_RECIPIENT.EVENT_ID))
                .where(events)
                .and(NOTIFICATION_RECIPIENT.READ_AT.isNull())
                .fetch(NOTIFICATION_RECIPIENT.RECIPIENT_ID);
        if (whose.isEmpty()) return Set.of();
        markUnread(NOTIFICATION_RECIPIENT.RECIPIENT_ID.in(whose), events, now);
        return Set.copyOf(whose);
    }

    private static String cut(String value, int max) {
        return value.length() <= max ? value : value.substring(0, max);
    }
}

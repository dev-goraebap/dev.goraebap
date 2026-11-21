package xyz.goraebap.cowork.module.notification.application;

import java.time.Clock;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.cowork.module.notification.Notice;
import xyz.goraebap.cowork.module.notification.NotificationFacade;
import xyz.goraebap.cowork.module.notification.Subject;
import xyz.goraebap.cowork.module.notification.domain.NotificationRepository;
import xyz.goraebap.cowork.module.realtime.RealtimeFacade;
import xyz.goraebap.cowork.module.realtime.Signal;
import xyz.goraebap.cowork.module.user.UserFacade;
import xyz.goraebap.cowork.shared.web.CurrentUser;

/** In-app notices: other modules leave them in their own transaction, members read and clear their own. */
@Service
@RequiredArgsConstructor
public class NotificationService implements NotificationFacade {
    private final NotificationRepository notificationRepository;
    private final NotificationQuery notificationQuery;
    private final UserFacade userFacade;
    private final RealtimeFacade realtimeFacade;
    private final PushOutbox pushOutbox;
    private final Clock clock;

    /**
     * Joins the caller's transaction, so a notice is kept only when the change it reports is, and its recipients'
     * screens hear of it once that commits. The pushes it asks for are queued in the same transaction and sent after.
     */
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void send(Notice notice) {
        if (notice.recipients().isEmpty()) return;
        var id = UUID.randomUUID();
        var now = clock.instant();
        notificationRepository.save(id, notice, now);
        pushOutbox.queue(id, notice, now);
        realtimeFacade.signal(Signal.to(Signal.Topic.NOTIFICATION, id, notice.recipients()));
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void seen(UUID recipientId, Subject subject) {
        settle(recipientId, subject, Notice.Ends.SEEN);
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void done(UUID recipientId, Subject subject) {
        settle(recipientId, subject, null);
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void closed(Subject subject) {
        heard(notificationRepository.markReadAbout(subject, clock.instant()));
    }

    /**
     * The member's screen showed the subject (a request's or an event's page, which the server cannot tell apart from a
     * page read ahead): their notices about it that only tell them something are done with.
     */
    @Transactional
    public void seen(CurrentUser user, NotificationRequests.Seen seen) {
        settle(
                user.id(),
                new Subject(seen.type(), seen.id()),
                Boolean.TRUE.equals(seen.includeActionable()) ? null : Notice.Ends.SEEN);
    }

    /** Notices whose time has passed (a reminder once its event started) are done with; every minute. */
    @Transactional
    public void expire() {
        heard(notificationRepository.markExpired(clock.instant()));
    }

    private void settle(UUID recipientId, Subject subject, Notice.Ends ends) {
        if (notificationRepository.markReadAbout(recipientId, subject, ends, clock.instant()) > 0)
            heard(Set.of(recipientId));
    }

    /** The members' screens read their count and lists again once this commits. */
    private void heard(Set<UUID> members) {
        if (!members.isEmpty()) realtimeFacade.signal(Signal.to(Signal.Topic.NOTIFICATION, UUID.randomUUID(), members));
    }

    /** One slice of the member's notices, each with the name of the member whose act it reports. */
    @Transactional(readOnly = true)
    public NotificationViews.NotificationSlice mine(
            CurrentUser user, NotificationRequests.NotificationListing listing) {
        var found = notificationQuery.findByRecipient(user.id(), listing);
        var names = userFacade.summariesOf(found.rows().stream()
                .map(NotificationViews.Row::actorId)
                .filter(Objects::nonNull)
                .distinct()
                .toList());
        var items = found.rows().stream()
                .map(row -> {
                    var actor = row.actorId() == null ? null : names.get(row.actorId());
                    return new NotificationViews.NotificationItem(
                            row.id(),
                            row.kind(),
                            row.actorId(),
                            actor == null ? null : actor.name(),
                            row.title(),
                            row.message(),
                            row.link(),
                            row.createdAt(),
                            row.readAt());
                })
                .toList();
        return new NotificationViews.NotificationSlice(items, found.nextCursor());
    }

    @Transactional(readOnly = true)
    public NotificationViews.UnreadNotifications unread(CurrentUser user) {
        return new NotificationViews.UnreadNotifications(notificationQuery.countUnread(user.id()));
    }

    @Transactional
    public void read(CurrentUser user, UUID id) {
        if (!notificationRepository.markRead(id, user.id(), clock.instant()))
            throw NotificationErrorCode.NOTIFICATION_NOT_FOUND.raise();
    }

    @Transactional
    public void readAll(CurrentUser user) {
        notificationRepository.markAllRead(user.id(), clock.instant());
    }
}

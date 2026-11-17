package xyz.goraebap.module.foundation.notification.domain;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import xyz.goraebap.module.foundation.notification.Notice;
import xyz.goraebap.module.foundation.notification.Subject;

public interface NotificationRepository {
    /**
     * Stores the notice once and a row for each recipient. A notice to see supersedes the recipients' unread notices to
     * see about the same subject, which are marked read; notices to act are left.
     */
    void save(UUID id, Notice notice, Instant now);

    /** Marks the member's notice read; reading again keeps the first time. Returns whether it was theirs. */
    boolean markRead(UUID id, UUID recipientId, Instant now);

    /** Marks every unread notice of the member read. */
    void markAllRead(UUID recipientId, Instant now);

    /** Marks read the member's unread notices about the subject that end as given (all of them when null); how many. */
    int markReadAbout(UUID recipientId, Subject subject, Notice.Ends ends, Instant now);

    /** Marks read everyone's unread notices about the subject; returns whose they were. */
    Set<UUID> markReadAbout(Subject subject, Instant now);

    /** Marks read every unread notice whose expiry has passed, as of its expiry; returns whose they were. */
    Set<UUID> markExpired(Instant now);
}

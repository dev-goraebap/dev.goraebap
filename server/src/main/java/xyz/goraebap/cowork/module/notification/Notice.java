package xyz.goraebap.cowork.module.notification;

import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * What happened, for whom. kind names the event, such as LEAVE_APPROVED; actorId is the member whose act it reports (the
 * requester, the approver, the writer), shown beside it, or null when no member did it; link is the screen that shows
 * it. Nobody is notified twice by one notice.
 *
 * <p>A notice also says what it is about (subject) and when it is done with, so the member need not clear it by hand:
 * one {@link #toSee} is done with once the member sees its subject, however they reach it, or a newer notice to see
 * about the same subject arrives; one {@link #toAct} only once they did what it asks (an approver's turn, once they
 * decided). Either is done with at expiresAt, when set: a reminder once the event starts, say.
 */
public record Notice(
        String kind,
        UUID actorId,
        String title,
        String message,
        String link,
        Set<UUID> recipients,
        Subject subject,
        Ends ends,
        Instant expiresAt) {
    /** What ends a notice for its recipient, besides expiresAt. */
    public enum Ends {
        /** Seeing its subject, or a newer notice to see about it. */
        SEEN,
        /** Doing what it asks; seeing its subject is not enough. */
        DONE
    }

    public Notice {
        recipients = Set.copyOf(new LinkedHashSet<>(recipients));
        Objects.requireNonNull(subject, "subject");
        Objects.requireNonNull(ends, "ends");
    }

    /** A notice that tells the member something; seeing what it is about is all it asks. */
    public static Notice toSee(
            Subject subject,
            String kind,
            UUID actorId,
            String title,
            String message,
            String link,
            Collection<UUID> recipients) {
        return new Notice(
                kind, actorId, title, message, link, new LinkedHashSet<>(recipients), subject, Ends.SEEN, null);
    }

    /** A notice that asks the member to do something; it stays until they did. */
    public static Notice toAct(
            Subject subject,
            String kind,
            UUID actorId,
            String title,
            String message,
            String link,
            Collection<UUID> recipients) {
        return new Notice(
                kind, actorId, title, message, link, new LinkedHashSet<>(recipients), subject, Ends.DONE, null);
    }

    /** The same notice, done with at the given moment whether or not the member saw it. */
    public Notice until(Instant expiresAt) {
        return new Notice(kind, actorId, title, message, link, recipients, subject, ends, expiresAt);
    }
}

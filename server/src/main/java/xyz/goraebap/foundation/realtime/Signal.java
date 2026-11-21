package xyz.goraebap.foundation.realtime;

import java.util.Collection;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Word that something a screen shows has changed: its topic and the id of what changed, for some members or for
 * everyone. It carries no content; a screen that cares reads what changed through the usual API, with the reader's
 * own rights. A signal may also reach every administrator, for screens only they have.
 */
public record Signal(Topic topic, UUID id, Set<UUID> recipients, boolean everyone, boolean administrators) {

    /** What changed, as the screens group it. */
    public enum Topic {
        /** A notice was left for the recipients. */
        NOTIFICATION,
        /** Pushes to a member were queued, sent or failed; for that member and every administrator. */
        PUSH,
        /** A project or its members changed; for who sees the project (the projects' order: everyone). */
        PROJECTS,
        /** An issue, its body or discussion, or a project's board columns changed; for who sees the project (labels: everyone). */
        ISSUES,
        /** A document, its body or a document folder changed; for everyone. */
        DOCUMENTS
    }

    public Signal {
        Objects.requireNonNull(topic, "topic");
        Objects.requireNonNull(id, "id");
        recipients = Set.copyOf(recipients);
    }

    /** For the given members only. */
    public static Signal to(Topic topic, UUID id, Collection<UUID> recipients) {
        return new Signal(topic, id, Set.copyOf(recipients), false, false);
    }

    /** For every member who is signed in. */
    public static Signal toEveryone(Topic topic, UUID id) {
        return new Signal(topic, id, Set.of(), true, false);
    }

    /** The same signal, reaching every administrator as well. */
    public Signal andAdministrators() {
        return new Signal(topic, id, recipients, everyone, true);
    }

    public boolean reaches(UUID member, boolean admin) {
        return everyone || (administrators && admin) || recipients.contains(member);
    }
}

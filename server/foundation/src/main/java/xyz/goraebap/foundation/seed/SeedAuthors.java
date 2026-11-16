package xyz.goraebap.foundation.seed;

import java.util.Optional;
import java.util.UUID;

/**
 * The people a seed file names, matched to members by the name the screens show (고재범): a name that is one member's who
 * may sign in is theirs; any other, or none, is the importer's, the member acting for the server, and the record says
 * who first wrote it.
 */
public interface SeedAuthors {
    /** The member acting for the server: app.seed.actor-email's, else an instance administrator, else a member. */
    UUID importer();

    /** Who wrote what a file brings, by the name it gives; the importer when the name is no single member's. */
    Author author(String name);

    /** The member a name is, to give them work (an assignee); empty when it is no single member who may sign in. */
    Optional<UUID> member(String name);

    /**
     * A writer: the member, and the name the file gave when it was not theirs (the importer's then), to say who first
     * wrote it.
     */
    record Author(UUID id, String unmatched) {
        /** "원래 작성자: 이름" when the writer was not matched; empty when they were or no name was given. */
        public Optional<String> note() {
            return Optional.ofNullable(unmatched).map(name -> "원래 작성자: " + name);
        }
    }
}

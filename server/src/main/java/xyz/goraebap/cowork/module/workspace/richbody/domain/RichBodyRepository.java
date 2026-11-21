package xyz.goraebap.cowork.module.workspace.richbody.domain;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Bodies with their kept versions, each body kept as its JSON text. */
public interface RichBodyRepository {
    Optional<Content> findById(UUID ownerId);

    /**
     * Inserts the body at version 1 when the owner has none, or writes it over expectedVersion as the next version;
     * false when the body changed since.
     */
    boolean save(Content content, long expectedVersion, UUID actor, Instant now);

    /** The kept versions, newest first, at most limit. */
    List<Revision> findRevisions(UUID ownerId, int limit);

    /** The kept versions without their bodies, newest first, at most limit (a body's version list). */
    List<Revision> findRevisionHeads(UUID ownerId, int limit);

    Optional<Revision> findRevision(UUID ownerId, UUID revisionId);

    boolean existsRevisionByOwnerId(UUID ownerId);

    void saveRevision(Revision revision, UUID actor);

    /** A body: its owner, the body JSON and its version (0 before the first save). */
    record Content(UUID ownerId, String ownerType, String body, long version) {}

    record Revision(UUID id, UUID ownerId, String body, String reason, Instant createdAt) {}
}

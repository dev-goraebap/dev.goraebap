package xyz.goraebap.module.workspace.project.domain;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import xyz.goraebap.module.workspace.project.ProjectRole;

public interface ProjectRepository {
    Optional<Project> findById(UUID id);

    /** The project a key names, its current key or one it had. */
    Optional<UUID> findIdByKey(String key);

    /** The project the key belongs to, current or old, whichever project that is; empty when no project ever had it. */
    Optional<UUID> findOwnerOfKey(String key);

    List<Project> findAllById(Collection<UUID> ids);

    /** The live, unarchived projects in their order. */
    List<UUID> findActiveIds();

    int nextPosition();

    /** Counts the project's work item numbers up by one and gives the new number. */
    long takeWorkItemNumber(UUID id);

    /**
     * Inserts or updates the project over the version it was read at, and makes its key the current one (keeping the
     * one it had as an old key); false when the project changed since.
     */
    boolean save(Project project, UUID actor, Instant now);

    /** Puts the given projects in this order (positions 0, 1, …); versions stay, the order not being an edit. */
    void updateOrder(List<UUID> orderedIds);

    /** Adds the member with the role; a member already there keeps theirs. */
    void addMember(UUID projectId, UUID userId, ProjectRole role, UUID actor, Instant now);

    /** Changes the member's role; false when they are not a member. */
    boolean changeRole(UUID projectId, UUID userId, ProjectRole role);

    void removeMember(UUID projectId, UUID userId);

    void setFavorite(UUID userId, UUID projectId, boolean favorite, Instant now);
}

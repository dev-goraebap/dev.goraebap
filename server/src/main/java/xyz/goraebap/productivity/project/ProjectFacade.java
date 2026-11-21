package xyz.goraebap.productivity.project;

import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * What other modules ask of a project. The office's events, minutes and overtime name a project by id and read how to
 * show it here; a project they name stays readable when it is archived or deleted.
 */
public interface ProjectFacade {
    /** The projects of the given ids, archived and deleted ones too, by id. */
    Map<UUID, ProjectSummary> summariesOf(Collection<UUID> ids);

    /** Whether work may name the project: it exists and is not deleted (an archived one may still be named). */
    boolean exists(UUID id);

    /** The project's description, the background its minutes are summarized against; empty when it has none. */
    Optional<String> descriptionOf(UUID id);

    /** The project a key names, its current key or one it had, in any case; deleted ones too. */
    Optional<ProjectSummary> findByKey(String key);

    /**
     * The next work item number of the project, taken from its counter within the caller's transaction, so a number is
     * given once even when the work item is later deleted.
     */
    long takeWorkItemNumber(UUID id);

    /**
     * The project the new one's key names, made first when no project ever had the key: for importers, which bring their
     * own projects (cowork-guide-projects). A project made here is made by actor at the given moment, as the screens make
     * one (with its board), the actor its first member; one found is left as it is, archived or deleted too.
     */
    ProjectSummary findOrCreate(UUID actor, Instant at, NewProject project);
}

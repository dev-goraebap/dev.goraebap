package xyz.goraebap.cowork.module.workspace.project.application;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import xyz.goraebap.cowork.module.workspace.project.ProjectRole;

/** The projects as the screens read them. */
public interface ProjectQuery {
    /**
     * Active projects in their order, archived and deleted ones by name, each with the reader's role and favourite mark;
     * only those the reader is a member of unless they are a Workspace administrator.
     */
    List<ProjectViews.ProjectView> findAll(ProjectRequests.Status status, Reader reader);

    ProjectViews.ProjectView findById(UUID id, Reader reader);

    /**
     * The members of live projects with their roles, users who have left included (the screen leaves out who it cannot
     * name); of every project for a Workspace administrator, else of the reader's own projects.
     */
    List<ProjectViews.Membership> findMemberships(Reader reader);

    /** The project's members with their role and when each joined, oldest first. */
    List<Joined> findMembers(UUID projectId);

    /** The user's member role in the project, if they are a member. */
    Optional<ProjectRole> findRole(UUID projectId, UUID userId);

    /** The projects the user is a member of. */
    Set<UUID> findProjectsOf(UUID userId);

    /** The user's role in each live project they are a member of. */
    Map<UUID, ProjectRole> findRolesOf(UUID userId);

    /** Who holds the Workspace administrator role (the user module keeps the roles). */
    Set<UUID> findWorkspaceAdministrators();

    /** The reader's favourite live projects among those they see. */
    List<UUID> findFavorites(Reader reader);

    record Joined(UUID userId, ProjectRole role, Instant at) {}

    /** Who reads: their id, and whether they are a Workspace administrator (who sees and keeps every project). */
    record Reader(UUID id, boolean workspaceAdmin) {}
}

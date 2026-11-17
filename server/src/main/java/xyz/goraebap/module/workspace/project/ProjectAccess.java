package xyz.goraebap.module.workspace.project;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * The one judge of who may do what in a project. Issues, documents, cycles, the board, a
 * project's events, signals, the agents' tools and search all ask here. Archiving and deleting lie on top: callers
 * still refuse writes to an archived project and find nothing of a deleted one.
 */
public interface ProjectAccess {
    /** The user's role in the project: ADMIN for a Workspace administrator, else their member role, else NONE. */
    ProjectRole roleOf(UUID projectId, CurrentUser user);

    /** The projects the user sees: every project for a Workspace administrator, else those they are a member of. */
    Visible visibleTo(CurrentUser user);

    /** The person's member role in each project they belong to (a Workspace administrator's own memberships too). */
    Map<UUID, ProjectRole> rolesOf(UUID userId);

    /** Who sees the project: its members and every Workspace administrator, to tell of its changes. */
    Set<UUID> viewersOf(UUID projectId);

    /** A set of projects someone sees; all when they see every project. */
    record Visible(boolean all, Set<UUID> ids) {
        public Visible {
            ids = all ? Set.of() : Set.copyOf(ids);
        }

        public static final Visible ALL = new Visible(true, Set.of());

        public boolean contains(UUID projectId) {
            return all || ids.contains(projectId);
        }
    }
}

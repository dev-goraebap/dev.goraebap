package xyz.goraebap.productivity.document.application.access;

import java.util.Map;
import java.util.UUID;
import xyz.goraebap.productivity.document.domain.access.Grant;
import xyz.goraebap.productivity.document.domain.access.Grant.Level;
import xyz.goraebap.productivity.project.ProjectRole;

/**
 * Who reads 문서함, as its grants see them: the member, whether they administer Projects (they see everything), and their
 * role in each project they are a member of (a project grant reaches its members).
 */
public record Reader(UUID userId, boolean admin, Map<UUID, ProjectRole> roles) {
    public Reader {
        roles = Map.copyOf(roles);
    }

    /** Whether the grant is for this reader, on an item made by maker. */
    public boolean isFor(Grant grant, UUID maker) {
        return switch (grant.subject()) {
            case OWNER -> userId.equals(maker);
            case USER -> userId.equals(grant.subjectId());
            case PROJECT -> roles.containsKey(grant.subjectId());
        };
    }

    /** Whether the reader keeps the project's documents as its administrator (or administers Projects). */
    public boolean administers(UUID projectId) {
        return admin || (projectId != null && roles.get(projectId) == ProjectRole.ADMIN);
    }

    /**
     * How far the reader's role in the project lets them go with its documents, whatever their grants say: a viewer
     * reads, an editor writes, an administrator manages; who is not a member nothing. The shared space (no project)
     * does not narrow.
     */
    public Level ceiling(UUID projectId) {
        if (admin || projectId == null) return Level.MANAGE;
        var role = roles.get(projectId);
        if (role == null) return Level.NONE;
        return switch (role) {
            case ADMIN -> Level.MANAGE;
            case EDITOR -> Level.WRITE;
            case VIEWER -> Level.READ;
            case NONE -> Level.NONE;
        };
    }
}

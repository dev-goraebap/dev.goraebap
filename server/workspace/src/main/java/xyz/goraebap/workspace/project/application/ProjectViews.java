package xyz.goraebap.workspace.project.application;

import java.time.Instant;
import java.util.UUID;
import xyz.goraebap.workspace.project.ProjectRole;

public final class ProjectViews {
    private ProjectViews() {}

    /**
     * A project as the screens list and open it, with how many members it has, whether it is the reader's favourite, and
     * the reader's role in it and what that lets them do (the screens hide what they cannot; the server still decides).
     */
    public record ProjectView(
            UUID id,
            String key,
            String name,
            String description,
            String icon,
            String color,
            int position,
            Instant archivedAt,
            Instant deletedAt,
            long version,
            int memberCount,
            boolean favorite,
            ProjectRole myRole,
            Can can,
            Instant createdAt,
            Instant updatedAt) {}

    /**
     * What the reader may do in a project: view it (viewer and up), edit its issues and documents (editor and up, not
     * while it is archived) and manage its settings and members (its administrator, not once it is deleted).
     */
    public record Can(boolean view, boolean edit, boolean manage) {
        public static Can of(ProjectRole role, boolean archived, boolean deleted) {
            return new Can(
                    role.atLeast(ProjectRole.VIEWER),
                    role.atLeast(ProjectRole.EDITOR) && !archived && !deleted,
                    role.atLeast(ProjectRole.ADMIN) && !deleted);
        }
    }

    /** One member of a project with their role, as its members page lists them. */
    public record MemberView(UUID userId, String name, String affiliationName, ProjectRole role, Instant joinedAt) {}

    /** That a member belongs to a project and with which role, for the area's members page. */
    public record Membership(UUID projectId, UUID userId, ProjectRole role) {}
}

package xyz.goraebap.cowork.module.workspace.project.application;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import xyz.goraebap.cowork.module.workspace.project.ProjectRole;
import xyz.goraebap.cowork.module.workspace.project.domain.Project;

public final class ProjectRequests {
    private ProjectRequests() {}

    /** Which projects to list: active (the default), archived, or deleted (Workspace administrators only). */
    public record Listing(Status status) {
        public Listing {
            if (status == null) status = Status.ACTIVE;
        }
    }

    public enum Status {
        ACTIVE,
        ARCHIVED,
        DELETED
    }

    /** A new project: its key (letters and digits, stored in capitals), name, description and mark. */
    public record CreateProject(
            @NotBlank @Pattern(regexp = Project.KEY_PATTERN) String key,
            @NotBlank @Size(max = Project.NAME_MAX) String name,
            @Size(max = Project.DESCRIPTION_MAX) String description,
            @Size(max = Project.ICON_MAX) String icon,
            @Pattern(regexp = Project.COLOR_PATTERN) String color) {}

    /** Everything the settings show, over the version they were read at. */
    public record EditProject(
            @NotNull Long expectedVersion,
            @NotBlank @Pattern(regexp = Project.KEY_PATTERN) String key,
            @NotBlank @Size(max = Project.NAME_MAX) String name,
            @Size(max = Project.DESCRIPTION_MAX) String description,
            @Size(max = Project.ICON_MAX) String icon,
            @Pattern(regexp = Project.COLOR_PATTERN) String color) {}

    /** Archiving, bringing back, deleting or restoring, over the version the screen read. */
    public record Versioned(@NotNull Long expectedVersion) {}

    /** Every live, unarchived project, each once, in the new order. */
    @Schema(name = "ProjectOrder")
    public record Order(@NotNull @Size(max = 1000) List<@NotNull UUID> ids) {
        public Order {
            ids = ids == null ? List.of() : List.copyOf(ids);
        }
    }

    /** Someone who works here joins the project with a role (an editor when none is given). */
    public record AddMember(@NotNull UUID userId, ProjectRole role) {
        public AddMember {
            if (role == null) role = ProjectRole.EDITOR;
        }
    }

    /** A member's new role in the project. */
    public record ChangeMember(@NotNull ProjectRole role) {}

    public record Favorite(@NotNull Boolean favorite) {}
}

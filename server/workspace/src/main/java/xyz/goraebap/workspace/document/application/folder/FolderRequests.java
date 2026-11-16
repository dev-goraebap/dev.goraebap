package xyz.goraebap.workspace.document.application.folder;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import xyz.goraebap.workspace.document.domain.Mark;
import xyz.goraebap.workspace.document.domain.folder.DocumentFolder;

public final class FolderRequests {
    private FolderRequests() {}

    /**
     * A new folder: its space (projectKey, the project's current or an old key; none for the shared space), the folder
     * it goes under (none, the space's top), its name and its mark (an icon and a #RRGGBB colour, either absent).
     */
    @Schema(name = "CreateDocumentFolder")
    public record CreateFolder(
            @Size(max = 10) String projectKey,
            UUID parentId,
            @NotBlank @Size(max = DocumentFolder.NAME_MAX) String name,
            @Size(max = Mark.ICON_MAX) String icon,
            @Pattern(regexp = Mark.COLOR_PATTERN) String color) {}

    /** A folder's mark, all of it at once: an icon and a #RRGGBB colour, either absent. */
    @Schema(name = "MarkDocumentFolder")
    public record MarkFolder(
            @NotNull Long expectedVersion,
            @Size(max = Mark.ICON_MAX) String icon,
            @Pattern(regexp = Mark.COLOR_PATTERN) String color) {}

    @Schema(name = "RenameDocumentFolder")
    public record RenameFolder(
            @NotNull Long expectedVersion,
            @NotBlank @Size(max = DocumentFolder.NAME_MAX) String name) {}

    /** Puts a folder under another of its space, or at its top when parentId is absent. */
    @Schema(name = "MoveDocumentFolder")
    public record MoveFolder(@NotNull Long expectedVersion, UUID parentId) {}
}

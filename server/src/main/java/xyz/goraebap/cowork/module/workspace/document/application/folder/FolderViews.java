package xyz.goraebap.cowork.module.workspace.document.application.folder;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

public final class FolderViews {
    private FolderViews() {}

    /**
     * A folder of a space as its tree shows it: where it sits (its parent, none at the space's top), its name and mark
     * (icon and colour, either absent), how many live documents it holds itself, who made it (who may delete it beside Workspace administrators) and its version.
     */
    @Schema(name = "DocumentFolderRow")
    public record FolderRow(
            UUID id,
            UUID parentId,
            String name,
            String icon,
            String color,
            int documentCount,
            UUID createdById,
            Instant createdAt,
            Instant updatedAt,
            long version) {}
}

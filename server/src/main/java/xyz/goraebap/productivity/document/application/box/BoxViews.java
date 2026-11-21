package xyz.goraebap.productivity.document.application.box;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

public final class BoxViews {
    private BoxViews() {}

    /**
     * A project's folder at the top of 문서함 (docs/pending-records.md, 문서함): there for every project that is not
     * deleted, whatever it holds, with the project's key, name and mark (icon and colour, either absent: the key's first
     * letter), whether it is archived (read only), how many folders and documents its space holds at its own top, and
     * who last wrote any of its documents and when (none while it has none).
     */
    @Schema(name = "DocumentBoxProject")
    public record ProjectFolder(
            UUID projectId,
            String key,
            String name,
            String icon,
            String color,
            boolean archived,
            int itemCount,
            UUID updatedById,
            String updatedByName,
            Instant updatedAt) {
        public ProjectFolder named(String updatedBy) {
            return new ProjectFolder(
                    projectId, key, name, icon, color, archived, itemCount, updatedById, updatedBy, updatedAt);
        }
    }
}

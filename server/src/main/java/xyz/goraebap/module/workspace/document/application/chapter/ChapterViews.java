package xyz.goraebap.module.workspace.document.application.chapter;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

public final class ChapterViews {
    private ChapterViews() {}

    /**
     * A chapter of a 매뉴얼 as its contents show it: where it sits (its parent, none at the first level) and its place
     * among its siblings, its title, who made it and who last wrote it (title, place or body) and when, and its version.
     * The screen builds the tree from each chapter's parent and position.
     */
    @Schema(name = "ManualChapterRow")
    public record ChapterRow(
            UUID id,
            UUID parentId,
            int position,
            String title,
            UUID createdById,
            UUID updatedById,
            String updatedByName,
            Instant updatedAt,
            long version) {
        public ChapterRow named(String updatedBy) {
            return new ChapterRow(
                    id, parentId, position, title, createdById, updatedById, updatedBy, updatedAt, version);
        }
    }
}

package xyz.goraebap.productivity.document.application.chapter;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import xyz.goraebap.productivity.document.domain.document.Document;

public final class ChapterRequests {
    private ChapterRequests() {}

    /** A new chapter of a 매뉴얼: under another chapter of it (none, the first level), last among its siblings. */
    @Schema(name = "CreateManualChapter")
    public record CreateChapter(
            UUID parentId,
            @NotBlank @Size(max = Document.TITLE_MAX) String title) {}

    @Schema(name = "RenameManualChapter")
    public record RenameChapter(
            @NotNull Long expectedVersion,
            @NotBlank @Size(max = Document.TITLE_MAX) String title) {}

    /**
     * Puts a chapter under another of its manual (none, the first level) at a place among its new siblings: index 0 is
     * the first, and an index past the last puts it last.
     */
    @Schema(name = "MoveManualChapter")
    public record MoveChapter(
            @NotNull Long expectedVersion,
            UUID parentId,
            @NotNull @Min(0) Integer index) {}
}

package xyz.goraebap.cowork.module.workspace.document.application.document;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import xyz.goraebap.cowork.module.workspace.document.domain.Mark;
import xyz.goraebap.cowork.module.workspace.document.domain.document.Document;
import xyz.goraebap.cowork.shared.web.SortDirection;

public final class DocumentRequests {
    private DocumentRequests() {}

    /** How a list of documents runs: by when each was last written or made, newest first, or by title (가나다). */
    public enum Sort {
        UPDATED,
        CREATED,
        TITLE
    }

    /**
     * A search over documents. project keeps one project's space (its key, current or old), shared the shared space;
     * neither, every live project's and the shared one. folderId keeps one folder's own documents; top, those at the
     * space's top. q matches part of the title or the body's text. cursor continues after the last slice read.
     */
    @Schema(name = "DocumentListing")
    public record Listing(
            @Size(max = 10) String project,
            Boolean shared,
            UUID folderId,
            Boolean top,
            @Size(max = Q_MAX) String q,
            Sort sort,
            SortDirection direction,
            @Size(max = 1000) String cursor,
            @Min(1) @Max(MAX_SIZE) Integer size) {
        public static final int Q_MAX = 100;
        public static final int DEFAULT_SIZE = 50;
        public static final int MAX_SIZE = 200;

        public Listing {
            project = project == null || project.isBlank() ? null : project.strip();
            shared = Boolean.TRUE.equals(shared);
            top = Boolean.TRUE.equals(top);
            q = q == null || q.isBlank() ? null : q.strip();
            cursor = cursor == null || cursor.isBlank() ? null : cursor;
            size = Objects.requireNonNullElse(size, DEFAULT_SIZE);
        }
    }

    /**
     * A new document: its space (projectKey, the project's current or an old key; none for the shared space), the
     * folder it goes in (none, the space's top), its kind (none, a page), its title and mark (an icon and a #RRGGBB
     * colour, either absent), and its first body (a 매뉴얼's cover) when it comes written, either as the body editor's
     * JSON (Tiptap, schemaVersion 1) or as Markdown, which the server turns into it; neither, an empty one.
     */
    @Schema(name = "CreateDocument")
    public record CreateDocument(
            @Size(max = 10) String projectKey,
            UUID folderId,
            Document.Kind kind,
            @NotBlank @Size(max = Document.TITLE_MAX) String title,
            @Size(max = Mark.ICON_MAX) String icon,
            @Pattern(regexp = Mark.COLOR_PATTERN) String color,
            Map<String, Object> body,
            @Size(max = MARKDOWN_MAX) String markdown,
            @Size(max = 100) List<UUID> labelIds,
            UUID parentId,
            @Size(max = 100) List<@NotNull UUID> uploadIds) {
        /** The longest Markdown a document starts from. */
        public static final int MARKDOWN_MAX = 1_000_000;

        public CreateDocument {
            kind = Objects.requireNonNullElse(kind, Document.Kind.PAGE);
            body = body == null ? null : Map.copyOf(present(body));
            markdown = markdown == null || markdown.isBlank() ? null : markdown;
            labelIds = labelIds == null ? List.of() : List.copyOf(labelIds);
            uploadIds = uploadIds == null ? List.of() : List.copyOf(uploadIds);
        }

        public CreateDocument(
                String projectKey,
                UUID folderId,
                Document.Kind kind,
                String title,
                String icon,
                String color,
                Map<String, Object> body,
                String markdown) {
            this(projectKey, folderId, kind, title, icon, color, body, markdown, List.of(), null);
        }

        public CreateDocument(
                String projectKey,
                UUID folderId,
                Document.Kind kind,
                String title,
                String icon,
                String color,
                Map<String, Object> body,
                String markdown,
                List<UUID> labelIds) {
            this(projectKey, folderId, kind, title, icon, color, body, markdown, labelIds, null);
        }

        public CreateDocument(
                String projectKey,
                UUID folderId,
                Document.Kind kind,
                String title,
                String icon,
                String color,
                Map<String, Object> body,
                String markdown,
                List<UUID> labelIds,
                UUID parentId) {
            this(projectKey, folderId, kind, title, icon, color, body, markdown, labelIds, parentId, List.of());
        }

        /** A page with no mark, as importers and agents make one. */
        public static CreateDocument page(String projectKey, UUID folderId, String title, String markdown) {
            return new CreateDocument(projectKey, folderId, null, title, null, null, null, markdown);
        }
    }

    @Schema(name = "RenameDocument")
    public record RenameDocument(
            @NotNull Long expectedVersion,
            @NotBlank @Size(max = Document.TITLE_MAX) String title) {}

    /** A document's mark, all of it at once: an icon and a #RRGGBB colour, either absent. */
    @Schema(name = "MarkDocument")
    public record MarkDocument(
            @NotNull Long expectedVersion,
            @Size(max = Mark.ICON_MAX) String icon,
            @Pattern(regexp = Mark.COLOR_PATTERN) String color) {}

    /** Puts a document in another folder of its space, or at its top when folderId is absent. */
    @Schema(name = "MoveDocument")
    public record MoveDocument(@NotNull Long expectedVersion, UUID folderId) {}

    /** A JSON object without the keys whose value is null, as JSON reads a missing key (Map.copyOf takes no nulls). */
    private static Map<String, Object> present(Map<String, Object> object) {
        var present = new LinkedHashMap<String, Object>();
        object.forEach((key, value) -> {
            if (key != null && value != null) present.put(key, value);
        });
        return present;
    }
}

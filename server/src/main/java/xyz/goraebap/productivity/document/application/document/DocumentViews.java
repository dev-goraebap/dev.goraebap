package xyz.goraebap.productivity.document.application.document;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import xyz.goraebap.productivity.document.domain.document.Document;

public final class DocumentViews {
    private DocumentViews() {}

    /** The current cascade scope, only after the same checks as deletion. */
    public record DeletionTarget(UUID id, String title, long version) {}

    /**
     * A document as lists show it: its space (a project's current key and name, none for the shared space), its folder
     * (none at the space's top), its kind, title and mark (icon and colour, either absent), how many chapters a 매뉴얼
     * holds (0 for a page), the first words of its body, who made it and who last wrote it (title, place
     * or body) and when, and its version.
     */
    public record DocumentRow(
            UUID id,
            UUID projectId,
            String projectKey,
            String projectName,
            UUID folderId,
            String folderName,
            Document.Kind kind,
            String title,
            String icon,
            String color,
            int chapterCount,
            String excerpt,
            UUID createdById,
            String createdByName,
            UUID updatedById,
            String updatedByName,
            Instant createdAt,
            Instant updatedAt,
            long version,
            UUID parentId) {
        /** The same row with its people's names, read after the page was chosen. */
        public DocumentRow named(String createdBy, String updatedBy) {
            return new DocumentRow(
                    id,
                    projectId,
                    projectKey,
                    projectName,
                    folderId,
                    folderName,
                    kind,
                    title,
                    icon,
                    color,
                    chapterCount,
                    excerpt,
                    createdById,
                    createdBy,
                    updatedById,
                    updatedBy,
                    createdAt,
                    updatedAt,
                    version,
                    parentId);
        }
    }

    /** One slice of a list, and the cursor for the next when there is one. */
    public record DocumentSlice(List<DocumentRow> items, String nextCursor) {
        public DocumentSlice {
            items = List.copyOf(items);
        }
    }

    /** A folder on the way down to a document, from the space's top. */
    public record FolderStep(UUID id, String name) {}

    /**
     * A document opened: its row, the folders down to it from its space's top, whether the reader may change it (its
     * space is not archived and its grants allow), delete it (they may change it and made it, manage it or administer
     * Projects) and change its grants (manage it).
     */
    public record DocumentView(
            DocumentRow document, List<FolderStep> path, boolean canWrite, boolean canDelete, boolean canManage) {
        public DocumentView {
            path = List.copyOf(path);
        }
    }
}

package xyz.goraebap.cowork.module.workspace.document.application.document;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import xyz.goraebap.cowork.shared.web.SortDirection;

/**
 * Documents as the screens read them; deleted documents and those of deleted projects are never shown. Rows carry no
 * people's names; they are joined once the page is chosen.
 */
public interface DocumentQuery {
    /** A document that changed in a window: its moments, and its latest live comment or reply in the window if any. */
    record Change(
            UUID id,
            String projectKey,
            String title,
            Instant createdAt,
            Instant updatedAt,
            Instant deletedAt,
            Instant commentedAt) {}

    record ChangeSlice(List<Change> rows, String nextCursor) {
        public ChangeSlice {
            rows = List.copyOf(rows);
        }
    }

    ChangeSlice changes(Filter filter, Instant since, Instant until, String cursor, int size);

    /** A slice of the documents matching the filter, in its order. */
    Slice findAll(Filter filter, String cursor, int size);

    /** One live document's row. */
    Optional<DocumentViews.DocumentRow> findRow(UUID documentId);

    /**
     * What to list: one project's space (projectId), the shared one (shared), or neither for every live project's and
     * the shared one; then one folder's own documents (folderId) or those at the space's top (top); text in the title or
     * the body; the order; and what the reader may not see (closed folders, whatever they hold, and closed documents).
     */
    record Filter(
            UUID projectId,
            boolean shared,
            UUID folderId,
            boolean top,
            String q,
            DocumentRequests.Sort sort,
            SortDirection direction,
            Set<UUID> hiddenFolderIds,
            Set<UUID> hiddenDocumentIds) {
        public Filter {
            hiddenFolderIds = Set.copyOf(hiddenFolderIds);
            hiddenDocumentIds = Set.copyOf(hiddenDocumentIds);
        }
    }

    record Slice(List<DocumentViews.DocumentRow> rows, String nextCursor) {
        public Slice {
            rows = List.copyOf(rows);
        }
    }
}

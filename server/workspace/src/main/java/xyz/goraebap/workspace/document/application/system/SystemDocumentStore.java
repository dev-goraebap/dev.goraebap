package xyz.goraebap.workspace.document.application.system;

import java.time.Instant;
import java.util.UUID;
import xyz.goraebap.workspace.document.SystemDocument;

/** Where a system folder's document rows are written: document, the same table as 문서함's own. */
public interface SystemDocumentStore {
    /** Inserts the row or updates it to the document as it now is, alive again if it was taken out. */
    void upsert(SystemDocument document);

    /** Marks the row deleted, by actor at the moment given. */
    void remove(UUID id, UUID actor, Instant at);
}

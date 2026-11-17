package xyz.goraebap.module.workspace.document;

import java.time.Instant;
import java.util.UUID;

/**
 * How a module keeps its documents' rows in 문서함 (docs/pending-records.md, 문서함): it puts the row whenever the document
 * changes, in the same transaction, and removes it when the document is gone (or, for a weekly report, while it is
 * only a draft).
 */
public interface SystemDocumentFacade {
    /** Writes the document's row as it now is, making it the first time. */
    void put(SystemDocument document);

    /** Takes the document's row out of every list, by actor at the given moment; none, nothing happens. */
    void remove(UUID id, UUID actor, Instant at);
}

package xyz.goraebap.workspace.document.domain.document;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentRepository {
    /** The document, deleted or not. */
    Optional<Document> findById(UUID id);

    List<Document> findAllIncludingDeleted(Collection<UUID> ids);

    List<Document> findAllIncludingDeleted();

    /** The live documents of the given ids. */
    List<Document> findAllById(Collection<UUID> ids);

    /**
     * Inserts the document, made by actor at now, or updates its title, folder and deletion over the version it was
     * read at as the next version; false when it changed since.
     */
    boolean save(Document document, UUID actor, Instant now);

    /**
     * Records that the body was written: its plain text, by whom and when, the document's version staying, so typing
     * never conflicts with a rename or a move.
     */
    void updateBody(UUID id, String bodyText, UUID actor, Instant now);
}

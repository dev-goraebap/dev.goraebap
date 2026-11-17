package xyz.goraebap.module.workspace.document.domain.folder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentFolderRepository {
    List<DocumentFolder> findAllIncludingDeleted();

    /** Every live folder of every space. */
    List<DocumentFolder> findAll();

    /** The folder, deleted or not. */
    Optional<DocumentFolder> findById(UUID id);

    /** Every live folder of a space (projectId null: the shared one), to walk its tree. */
    List<DocumentFolder> findAllByProjectId(UUID projectId);

    /** Whether the folder holds a live folder or a live document. */
    boolean existsContentById(UUID id);

    /**
     * Inserts the folder, made by actor at now, or updates it over the version it was read at as the next version;
     * false when it changed since.
     */
    boolean save(DocumentFolder folder, UUID actor, Instant now);
}

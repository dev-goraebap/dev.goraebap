package xyz.goraebap.module.workspace.document.domain.chapter;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ManualChapterRepository {
    /** The chapter, deleted or not. */
    Optional<ManualChapter> findById(UUID id);

    /** Every live chapter of a manual. */
    List<ManualChapter> findAllByDocumentId(UUID documentId);

    /**
     * Inserts each chapter, made by actor at now, or updates its place, title and deletion over the version it was read
     * at as the next version, all in one go; false when any changed since.
     */
    boolean saveAll(Collection<ManualChapter> chapters, UUID actor, Instant now);

    /** Records that the body was written: its plain text, by whom and when, the chapter's version staying. */
    void updateBody(UUID id, String bodyText, UUID actor, Instant now);
}

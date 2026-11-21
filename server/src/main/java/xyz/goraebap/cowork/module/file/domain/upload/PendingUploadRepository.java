package xyz.goraebap.cowork.module.file.domain.upload;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PendingUploadRepository {
    void save(PendingUpload upload);

    /** Reads the uploads under the write lock so two commands cannot bind the same one. */
    List<PendingUpload> findAllByIdForUpdate(Collection<UUID> ids);

    List<PendingUpload> findAllCreatedBefore(Instant instant, int limit);

    void deleteAllById(Collection<UUID> ids);
}

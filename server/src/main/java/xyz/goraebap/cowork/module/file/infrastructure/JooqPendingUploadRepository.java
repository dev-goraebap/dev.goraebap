package xyz.goraebap.cowork.module.file.infrastructure;

import static xyz.goraebap.cowork.jooq.tables.PendingUpload.PENDING_UPLOAD;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.cowork.jooq.tables.records.PendingUploadRecord;
import xyz.goraebap.cowork.module.file.domain.upload.FileFormat;
import xyz.goraebap.cowork.module.file.domain.upload.ImageTraits;
import xyz.goraebap.cowork.module.file.domain.upload.PendingUpload;
import xyz.goraebap.cowork.module.file.domain.upload.PendingUploadRepository;

/**
 * An upload waits under owner type DRAFT with its uploader as owner, since the columns require an owner and the real
 * one does not exist yet. The declared size is not a column; the signed upload URL enforces it and binding reads the
 * stored size.
 */
@Repository
@RequiredArgsConstructor
class JooqPendingUploadRepository implements PendingUploadRepository {
    static final String DRAFT = "DRAFT";

    private final DSLContext dslContext;

    public void save(PendingUpload upload) {
        dslContext
                .insertInto(PENDING_UPLOAD)
                .set(PENDING_UPLOAD.PENDING_UPLOAD_ID, upload.id())
                .set(PENDING_UPLOAD.BLOB_ID, upload.blobId())
                .set(PENDING_UPLOAD.STORAGE_KEY, upload.storageKey())
                .set(PENDING_UPLOAD.OWNER_TYPE, DRAFT)
                .set(PENDING_UPLOAD.OWNER_ID, upload.uploaderId())
                .set(PENDING_UPLOAD.FILENAME, upload.filename())
                .set(PENDING_UPLOAD.MIME_TYPE, upload.format().contentType())
                .set(PENDING_UPLOAD.CREATED_AT, upload.createdAt())
                .set(PENDING_UPLOAD.UPDATED_AT, upload.createdAt())
                .set(PENDING_UPLOAD.CREATED_BY, upload.uploaderId())
                .set(PENDING_UPLOAD.UPDATED_BY, upload.uploaderId())
                .set(PENDING_UPLOAD.DOMINANT_COLOR, upload.traits().dominantColor())
                .set(PENDING_UPLOAD.WIDTH, upload.traits().width())
                .set(PENDING_UPLOAD.HEIGHT, upload.traits().height())
                .execute();
    }

    public List<PendingUpload> findAllByIdForUpdate(Collection<UUID> ids) {
        if (ids.isEmpty()) return List.of();
        return dslContext
                .selectFrom(PENDING_UPLOAD)
                .where(PENDING_UPLOAD.PENDING_UPLOAD_ID.in(ids))
                .and(PENDING_UPLOAD.OWNER_TYPE.eq(DRAFT))
                .fetch(JooqPendingUploadRepository::upload);
    }

    public List<PendingUpload> findAllCreatedBefore(Instant instant, int limit) {
        return dslContext
                .selectFrom(PENDING_UPLOAD)
                .where(PENDING_UPLOAD.CREATED_AT.lt(instant))
                .orderBy(PENDING_UPLOAD.CREATED_AT, PENDING_UPLOAD.PENDING_UPLOAD_ID)
                .limit(limit)
                .fetch(JooqPendingUploadRepository::upload);
    }

    public void deleteAllById(Collection<UUID> ids) {
        if (ids.isEmpty()) return;
        dslContext
                .deleteFrom(PENDING_UPLOAD)
                .where(PENDING_UPLOAD.PENDING_UPLOAD_ID.in(ids))
                .execute();
    }

    /** Rows from other writers may carry a type this module does not accept; they read as PDF and fail binding. */
    private static PendingUpload upload(PendingUploadRecord row) {
        var format = FileFormat.ofFilename(row.getFilename())
                .or(() -> FileFormat.ofContentType(row.getMimeType()))
                .orElse(FileFormat.PDF);
        return PendingUpload.fromPersistence(
                row.getPendingUploadId(),
                row.getBlobId(),
                row.getCreatedBy() == null ? row.getOwnerId() : row.getCreatedBy(),
                row.getFilename(),
                format,
                0,
                row.getStorageKey(),
                row.getCreatedAt(),
                new ImageTraits(row.getDominantColor(), row.getWidth(), row.getHeight()));
    }
}

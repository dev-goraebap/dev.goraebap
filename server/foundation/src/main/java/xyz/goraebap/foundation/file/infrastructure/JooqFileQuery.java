package xyz.goraebap.foundation.file.infrastructure;

import static xyz.goraebap.foundation.jooq.tables.Attachment.ATTACHMENT;
import static xyz.goraebap.foundation.jooq.tables.Blob.BLOB;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;
import xyz.goraebap.foundation.file.application.FileQuery;
import xyz.goraebap.foundation.file.application.FileViews;

@Repository
@RequiredArgsConstructor
class JooqFileQuery implements FileQuery {
    private final DSLContext dslContext;

    public List<FileViews.StoredFile> findByOwners(String ownerType, Collection<UUID> ownerIds) {
        if (ownerIds.isEmpty()) return List.of();
        return select(ATTACHMENT.OWNER_TYPE.eq(ownerType).and(ATTACHMENT.OWNER_ID.in(ownerIds)));
    }

    public Optional<FileViews.StoredFile> findOne(String ownerType, UUID ownerId, UUID attachmentId) {
        return select(ATTACHMENT
                        .OWNER_TYPE
                        .eq(ownerType)
                        .and(ATTACHMENT.OWNER_ID.eq(ownerId))
                        .and(ATTACHMENT.ATTACHMENT_ID.eq(attachmentId)))
                .stream()
                .findFirst();
    }

    private List<FileViews.StoredFile> select(Condition condition) {
        return dslContext
                .select(
                        ATTACHMENT.ATTACHMENT_ID,
                        ATTACHMENT.OWNER_ID,
                        BLOB.FILENAME,
                        BLOB.CONTENT_TYPE,
                        BLOB.BYTE_SIZE,
                        BLOB.STORAGE_KEY,
                        BLOB.DOMINANT_COLOR,
                        BLOB.WIDTH,
                        BLOB.HEIGHT)
                .from(ATTACHMENT)
                .join(BLOB)
                .on(BLOB.BLOB_ID.eq(ATTACHMENT.BLOB_ID))
                .where(condition)
                .and(ATTACHMENT.DELETED_AT.isNull())
                .and(BLOB.DELETED_AT.isNull())
                .orderBy(ATTACHMENT.OWNER_ID, ATTACHMENT.POSITION, ATTACHMENT.CREATED_AT, ATTACHMENT.ATTACHMENT_ID)
                .fetch(JooqFileQuery::file);
    }

    private static FileViews.StoredFile file(Record row) {
        return new FileViews.StoredFile(
                row.get(ATTACHMENT.ATTACHMENT_ID),
                row.get(ATTACHMENT.OWNER_ID),
                row.get(BLOB.FILENAME),
                row.get(BLOB.CONTENT_TYPE),
                row.get(BLOB.BYTE_SIZE),
                row.get(BLOB.STORAGE_KEY),
                row.get(BLOB.DOMINANT_COLOR),
                row.get(BLOB.WIDTH),
                row.get(BLOB.HEIGHT));
    }
}

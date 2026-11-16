package xyz.goraebap.foundation.file.infrastructure;

import static xyz.goraebap.foundation.jooq.tables.Attachment.ATTACHMENT;
import static xyz.goraebap.foundation.jooq.tables.Blob.BLOB;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Query;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.foundation.file.domain.attachment.Attachment;
import xyz.goraebap.foundation.file.domain.attachment.AttachmentRepository;

@Repository
@RequiredArgsConstructor
class JooqAttachmentRepository implements AttachmentRepository {
    private final DSLContext dslContext;
    private final Clock clock;

    public void deleteOfOwner(String ownerType, UUID ownerId, Collection<UUID> attachmentIds, UUID actor) {
        if (attachmentIds.isEmpty()) return;
        var now = clock.instant();
        dslContext
                .update(ATTACHMENT)
                .set(ATTACHMENT.DELETED_AT, now)
                .set(ATTACHMENT.UPDATED_AT, now)
                .set(ATTACHMENT.UPDATED_BY, actor)
                .where(ATTACHMENT.OWNER_TYPE.eq(ownerType))
                .and(ATTACHMENT.OWNER_ID.eq(ownerId))
                .and(ATTACHMENT.ATTACHMENT_ID.in(attachmentIds))
                .and(ATTACHMENT.DELETED_AT.isNull())
                .execute();
    }

    public List<String> discardBlobs(Collection<UUID> attachmentIds, UUID actor) {
        if (attachmentIds.isEmpty()) return List.of();
        var now = clock.instant();
        var kept = ATTACHMENT.as("kept");
        // A blob another kept attachment shares (a copied series' file) stays.
        var unshared = BLOB.BLOB_ID
                .in(dslContext
                        .select(ATTACHMENT.BLOB_ID)
                        .from(ATTACHMENT)
                        .where(ATTACHMENT.ATTACHMENT_ID.in(attachmentIds)))
                .and(BLOB.DELETED_AT.isNull())
                .andNotExists(dslContext
                        .selectOne()
                        .from(kept)
                        .where(kept.BLOB_ID.eq(BLOB.BLOB_ID))
                        .and(kept.DELETED_AT.isNull()));
        var keys =
                dslContext.select(BLOB.STORAGE_KEY).from(BLOB).where(unshared).fetch(BLOB.STORAGE_KEY);
        if (keys.isEmpty()) return List.of();
        dslContext
                .update(BLOB)
                .set(BLOB.DELETED_AT, now)
                .set(BLOB.UPDATED_AT, now)
                .set(BLOB.UPDATED_BY, actor)
                .where(BLOB.STORAGE_KEY.in(keys))
                .and(BLOB.DELETED_AT.isNull())
                .execute();
        return keys;
    }

    public void copy(String ownerType, UUID fromOwnerId, UUID toOwnerId, Map<UUID, UUID> newIds, UUID actor) {
        if (newIds.isEmpty()) return;
        var now = clock.instant();
        Integer last = dslContext
                .select(DSL.max(ATTACHMENT.POSITION))
                .from(ATTACHMENT)
                .where(ATTACHMENT.OWNER_TYPE.eq(ownerType))
                .and(ATTACHMENT.OWNER_ID.eq(toOwnerId))
                .and(ATTACHMENT.DELETED_AT.isNull())
                .fetchOne(0, Integer.class);
        var blobs = dslContext
                .select(ATTACHMENT.ATTACHMENT_ID, ATTACHMENT.BLOB_ID)
                .from(ATTACHMENT)
                .where(ATTACHMENT.OWNER_TYPE.eq(ownerType))
                .and(ATTACHMENT.OWNER_ID.eq(fromOwnerId))
                .and(ATTACHMENT.ATTACHMENT_ID.in(newIds.keySet()))
                .and(ATTACHMENT.DELETED_AT.isNull())
                .fetchMap(ATTACHMENT.ATTACHMENT_ID, ATTACHMENT.BLOB_ID);
        int position = last == null ? 0 : last + 1;
        List<Query> queries = new ArrayList<>();
        for (var entry : newIds.entrySet()) {
            var blobId = blobs.get(entry.getKey());
            if (blobId == null) continue;
            queries.add(dslContext
                    .insertInto(ATTACHMENT)
                    .set(ATTACHMENT.ATTACHMENT_ID, entry.getValue())
                    .set(ATTACHMENT.BLOB_ID, blobId)
                    .set(ATTACHMENT.OWNER_TYPE, ownerType)
                    .set(ATTACHMENT.OWNER_ID, toOwnerId)
                    .set(ATTACHMENT.POSITION, position++)
                    .set(ATTACHMENT.CREATED_AT, now)
                    .set(ATTACHMENT.UPDATED_AT, now)
                    .set(ATTACHMENT.CREATED_BY, actor)
                    .set(ATTACHMENT.UPDATED_BY, actor));
        }
        if (!queries.isEmpty()) dslContext.batch(queries).execute();
    }

    public List<String> discardedKeysSince(Instant since, int limit) {
        return dslContext
                .select(BLOB.STORAGE_KEY)
                .from(BLOB)
                .where(BLOB.DELETED_AT.ge(since))
                .orderBy(BLOB.DELETED_AT)
                .limit(limit)
                .fetch(BLOB.STORAGE_KEY);
    }

    public void saveAll(List<Attachment> attachments) {
        if (attachments.isEmpty()) return;
        var now = clock.instant();
        List<Query> queries = new ArrayList<>();
        for (var attachment : attachments) {
            queries.add(dslContext
                    .insertInto(BLOB)
                    .set(BLOB.BLOB_ID, attachment.blobId())
                    .set(BLOB.STORAGE_KEY, attachment.storageKey())
                    .set(BLOB.FILENAME, attachment.filename())
                    .set(BLOB.CONTENT_TYPE, attachment.format().contentType())
                    .set(BLOB.BYTE_SIZE, attachment.size())
                    .set(BLOB.CREATED_AT, now)
                    .set(BLOB.UPDATED_AT, now)
                    .set(BLOB.CREATED_BY, attachment.createdBy())
                    .set(BLOB.UPDATED_BY, attachment.createdBy())
                    .set(BLOB.DOMINANT_COLOR, attachment.traits().dominantColor())
                    .set(BLOB.WIDTH, attachment.traits().width())
                    .set(BLOB.HEIGHT, attachment.traits().height()));
            queries.add(dslContext
                    .insertInto(ATTACHMENT)
                    .set(ATTACHMENT.ATTACHMENT_ID, attachment.id())
                    .set(ATTACHMENT.BLOB_ID, attachment.blobId())
                    .set(ATTACHMENT.OWNER_TYPE, attachment.ownerType())
                    .set(ATTACHMENT.OWNER_ID, attachment.ownerId())
                    .set(ATTACHMENT.POSITION, attachment.position())
                    .set(ATTACHMENT.CREATED_AT, now)
                    .set(ATTACHMENT.UPDATED_AT, now)
                    .set(ATTACHMENT.CREATED_BY, attachment.createdBy())
                    .set(ATTACHMENT.UPDATED_BY, attachment.createdBy()));
        }
        dslContext.batch(queries).execute();
    }
}

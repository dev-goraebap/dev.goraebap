package xyz.goraebap.productivity.richbody.infrastructure;

import static xyz.goraebap.jooq.tables.RichBody.RICH_BODY;
import static xyz.goraebap.jooq.tables.RichBodyRevision.RICH_BODY_REVISION;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.jooq.tables.records.RichBodyRevisionRecord;
import xyz.goraebap.productivity.richbody.domain.RichBodyRepository;

@Repository
@RequiredArgsConstructor
class JooqRichBodyRepository implements RichBodyRepository {
    /**
     * What the anchors and comment sequence columns keep since the body's threads became timeline comments (V35): SQLite
     * keeps a column a CHECK names, so they stay, empty.
     */
    private static final String NO_ANCHORS = "{}";

    private final DSLContext dslContext;

    @Override
    public Optional<Content> findById(UUID ownerId) {
        return dslContext
                .selectFrom(RICH_BODY)
                .where(RICH_BODY.OWNER_ID.eq(ownerId))
                .fetchOptional(
                        row -> new Content(row.getOwnerId(), row.getOwnerType(), row.getBody(), row.getVersion()));
    }

    @Override
    public boolean save(Content content, long expectedVersion, UUID actor, Instant now) {
        int updated = dslContext
                .update(RICH_BODY)
                .set(RICH_BODY.BODY, content.body())
                .set(RICH_BODY.VERSION, expectedVersion + 1)
                .set(RICH_BODY.UPDATED_AT, now)
                .set(RICH_BODY.UPDATED_BY, actor)
                .where(RICH_BODY.OWNER_ID.eq(content.ownerId()).and(RICH_BODY.VERSION.eq(expectedVersion)))
                .execute();
        if (updated > 0) return true;
        if (expectedVersion != 0 || dslContext.fetchExists(RICH_BODY, RICH_BODY.OWNER_ID.eq(content.ownerId())))
            return false;
        insert(content, 1, actor, now);
        return true;
    }

    private void insert(Content content, long version, UUID actor, Instant now) {
        dslContext
                .insertInto(RICH_BODY)
                .set(RICH_BODY.OWNER_ID, content.ownerId())
                .set(RICH_BODY.OWNER_TYPE, content.ownerType())
                .set(RICH_BODY.BODY, content.body())
                .set(RICH_BODY.ANCHORS, NO_ANCHORS)
                .set(RICH_BODY.COMMENT_SEQ, 0L)
                .set(RICH_BODY.VERSION, version)
                .set(RICH_BODY.UPDATED_AT, now)
                .set(RICH_BODY.UPDATED_BY, actor)
                .execute();
    }

    @Override
    public List<Revision> findRevisions(UUID ownerId, int limit) {
        return dslContext
                .selectFrom(RICH_BODY_REVISION)
                .where(RICH_BODY_REVISION.OWNER_ID.eq(ownerId))
                .orderBy(RICH_BODY_REVISION.CREATED_AT.desc(), RICH_BODY_REVISION.REVISION_ID.desc())
                .limit(limit)
                .fetch(JooqRichBodyRepository::revision);
    }

    @Override
    public List<Revision> findRevisionHeads(UUID ownerId, int limit) {
        return dslContext
                .select(RICH_BODY_REVISION.REVISION_ID, RICH_BODY_REVISION.REASON, RICH_BODY_REVISION.CREATED_AT)
                .from(RICH_BODY_REVISION)
                .where(RICH_BODY_REVISION.OWNER_ID.eq(ownerId))
                .orderBy(RICH_BODY_REVISION.CREATED_AT.desc(), RICH_BODY_REVISION.REVISION_ID.desc())
                .limit(limit)
                .fetch(row -> new Revision(row.value1(), ownerId, null, row.value2(), row.value3()));
    }

    @Override
    public Optional<Revision> findRevision(UUID ownerId, UUID revisionId) {
        return dslContext
                .selectFrom(RICH_BODY_REVISION)
                .where(RICH_BODY_REVISION.OWNER_ID.eq(ownerId).and(RICH_BODY_REVISION.REVISION_ID.eq(revisionId)))
                .fetchOptional(JooqRichBodyRepository::revision);
    }

    @Override
    public boolean existsRevisionByOwnerId(UUID ownerId) {
        return dslContext.fetchExists(RICH_BODY_REVISION, RICH_BODY_REVISION.OWNER_ID.eq(ownerId));
    }

    @Override
    public void saveRevision(Revision revision, UUID actor) {
        dslContext
                .insertInto(RICH_BODY_REVISION)
                .set(RICH_BODY_REVISION.REVISION_ID, revision.id())
                .set(RICH_BODY_REVISION.OWNER_ID, revision.ownerId())
                .set(RICH_BODY_REVISION.BODY, "")
                .set(RICH_BODY_REVISION.BODY_GZ, gzip(revision.body()))
                .set(RICH_BODY_REVISION.ANCHORS, NO_ANCHORS)
                .set(RICH_BODY_REVISION.COMMENT_SEQ, 0L)
                .set(RICH_BODY_REVISION.REASON, revision.reason())
                .set(RICH_BODY_REVISION.CREATED_AT, revision.createdAt())
                .set(RICH_BODY_REVISION.CREATED_BY, actor)
                .execute();
    }

    private static Revision revision(RichBodyRevisionRecord row) {
        String body = row.getBodyGz() == null ? row.getBody() : gunzip(row.getBodyGz());
        return new Revision(row.getRevisionId(), row.getOwnerId(), body, row.getReason(), row.getCreatedAt());
    }

    /** A kept version is kept gzip-compressed (a JSON body shrinks several times): the body column stays empty. */
    private static byte[] gzip(String text) {
        var bytes = new ByteArrayOutputStream();
        try (var zip = new GZIPOutputStream(bytes)) {
            zip.write(text.getBytes(StandardCharsets.UTF_8));
        } catch (IOException impossible) {
            throw new UncheckedIOException(impossible);
        }
        return bytes.toByteArray();
    }

    private static String gunzip(byte[] compressed) {
        try (var zip = new GZIPInputStream(new ByteArrayInputStream(compressed))) {
            return new String(zip.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException unreadable) {
            throw new UncheckedIOException(unreadable);
        }
    }
}

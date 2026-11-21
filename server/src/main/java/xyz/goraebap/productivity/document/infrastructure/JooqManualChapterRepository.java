package xyz.goraebap.productivity.document.infrastructure;

import static xyz.goraebap.jooq.tables.ManualChapter.MANUAL_CHAPTER;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Query;
import org.springframework.stereotype.Repository;
import xyz.goraebap.jooq.tables.records.ManualChapterRecord;
import xyz.goraebap.productivity.document.domain.chapter.ManualChapter;
import xyz.goraebap.productivity.document.domain.chapter.ManualChapterRepository;

@Repository
@RequiredArgsConstructor
class JooqManualChapterRepository implements ManualChapterRepository {
    private final DSLContext dslContext;

    @Override
    public Optional<ManualChapter> findById(UUID id) {
        return dslContext
                .selectFrom(MANUAL_CHAPTER)
                .where(MANUAL_CHAPTER.CHAPTER_ID.eq(id))
                .fetchOptional()
                .map(JooqManualChapterRepository::chapter);
    }

    @Override
    public List<ManualChapter> findAllByDocumentId(UUID documentId) {
        return dslContext
                .selectFrom(MANUAL_CHAPTER)
                .where(MANUAL_CHAPTER.DOCUMENT_ID.eq(documentId).and(MANUAL_CHAPTER.DELETED_AT.isNull()))
                .orderBy(MANUAL_CHAPTER.POSITION, MANUAL_CHAPTER.CHAPTER_ID)
                .fetch(JooqManualChapterRepository::chapter);
    }

    /** One batch of updates over the versions read; the chapters none of them found are new, and go in one batch more. */
    @Override
    public boolean saveAll(Collection<ManualChapter> chapters, UUID actor, Instant now) {
        if (chapters.isEmpty()) return true;
        var ordered = List.copyOf(chapters);
        List<Query> updates = ordered.stream()
                .<Query>map(chapter -> dslContext
                        .update(MANUAL_CHAPTER)
                        .set(MANUAL_CHAPTER.PARENT_ID, chapter.parentId())
                        .set(MANUAL_CHAPTER.POSITION, chapter.position())
                        .set(MANUAL_CHAPTER.TITLE, chapter.title())
                        .set(MANUAL_CHAPTER.DELETED_AT, chapter.deletedAt())
                        .set(MANUAL_CHAPTER.DELETED_BY, chapter.isDeleted() ? actor : null)
                        .set(MANUAL_CHAPTER.VERSION, MANUAL_CHAPTER.VERSION.plus(1))
                        .set(MANUAL_CHAPTER.UPDATED_AT, now)
                        .set(MANUAL_CHAPTER.UPDATED_BY, actor)
                        .where(MANUAL_CHAPTER
                                .CHAPTER_ID
                                .eq(chapter.id())
                                .and(MANUAL_CHAPTER.VERSION.eq(chapter.version()))))
                .toList();
        int[] updated = dslContext.batch(updates).execute();
        var missing = new ArrayList<ManualChapter>();
        for (int at = 0; at < updated.length; at++) if (updated[at] == 0) missing.add(ordered.get(at));
        if (missing.isEmpty()) return true;
        if (dslContext.fetchExists(
                MANUAL_CHAPTER,
                MANUAL_CHAPTER.CHAPTER_ID.in(
                        missing.stream().map(ManualChapter::id).toList()))) return false;
        dslContext
                .batch(missing.stream()
                        .<Query>map(chapter -> dslContext
                                .insertInto(MANUAL_CHAPTER)
                                .set(MANUAL_CHAPTER.CHAPTER_ID, chapter.id())
                                .set(MANUAL_CHAPTER.DOCUMENT_ID, chapter.documentId())
                                .set(MANUAL_CHAPTER.PARENT_ID, chapter.parentId())
                                .set(MANUAL_CHAPTER.POSITION, chapter.position())
                                .set(MANUAL_CHAPTER.TITLE, chapter.title())
                                .set(MANUAL_CHAPTER.BODY_TEXT, "")
                                .set(MANUAL_CHAPTER.VERSION, 0L)
                                .set(MANUAL_CHAPTER.CREATED_AT, now)
                                .set(MANUAL_CHAPTER.CREATED_BY, chapter.createdBy())
                                .set(MANUAL_CHAPTER.UPDATED_AT, now)
                                .set(MANUAL_CHAPTER.UPDATED_BY, actor))
                        .toList())
                .execute();
        return true;
    }

    @Override
    public void updateBody(UUID id, String bodyText, UUID actor, Instant now) {
        dslContext
                .update(MANUAL_CHAPTER)
                .set(MANUAL_CHAPTER.BODY_TEXT, bodyText)
                .set(MANUAL_CHAPTER.UPDATED_AT, now)
                .set(MANUAL_CHAPTER.UPDATED_BY, actor)
                .where(MANUAL_CHAPTER.CHAPTER_ID.eq(id))
                .execute();
    }

    private static ManualChapter chapter(ManualChapterRecord row) {
        return ManualChapter.fromPersistence(
                row.getChapterId(),
                row.getDocumentId(),
                row.getParentId(),
                row.getPosition(),
                row.getTitle(),
                row.getCreatedBy(),
                row.getDeletedAt(),
                row.getVersion());
    }
}

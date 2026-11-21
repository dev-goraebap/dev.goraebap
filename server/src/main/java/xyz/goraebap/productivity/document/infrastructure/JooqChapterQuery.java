package xyz.goraebap.productivity.document.infrastructure;

import static xyz.goraebap.jooq.tables.ManualChapter.MANUAL_CHAPTER;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.productivity.document.application.chapter.ChapterQuery;
import xyz.goraebap.productivity.document.application.chapter.ChapterViews;

@Repository
@RequiredArgsConstructor
class JooqChapterQuery implements ChapterQuery {
    private final DSLContext dslContext;

    @Override
    public List<ChapterViews.ChapterRow> findAll(UUID documentId) {
        return dslContext
                .selectFrom(MANUAL_CHAPTER)
                .where(MANUAL_CHAPTER.DOCUMENT_ID.eq(documentId).and(MANUAL_CHAPTER.DELETED_AT.isNull()))
                .orderBy(MANUAL_CHAPTER.POSITION, MANUAL_CHAPTER.CHAPTER_ID)
                .fetch(row -> new ChapterViews.ChapterRow(
                        row.getChapterId(),
                        row.getParentId(),
                        row.getPosition(),
                        row.getTitle(),
                        row.getCreatedBy(),
                        row.getUpdatedBy(),
                        null,
                        row.getUpdatedAt(),
                        row.getVersion()));
    }
}

package xyz.goraebap.workspace.document.infrastructure;

import static xyz.goraebap.workspace.jooq.tables.Document.DOCUMENT;

import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.workspace.document.SystemDocument;
import xyz.goraebap.workspace.document.application.system.SystemDocumentStore;

@Repository
@RequiredArgsConstructor
class JooqSystemDocumentStore implements SystemDocumentStore {
    private final DSLContext dslContext;

    @Override
    public void upsert(SystemDocument document) {
        int updated = dslContext
                .update(DOCUMENT)
                .set(DOCUMENT.PROJECT_ID, document.projectId())
                .set(DOCUMENT.FACET_ID, document.facetId())
                .set(DOCUMENT.TITLE, document.title())
                .set(DOCUMENT.BODY_TEXT, document.bodyText())
                .set(DOCUMENT.UPDATED_AT, document.updatedAt())
                .set(DOCUMENT.UPDATED_BY, document.updatedBy())
                .setNull(DOCUMENT.DELETED_AT)
                .setNull(DOCUMENT.DELETED_BY)
                .where(DOCUMENT.DOCUMENT_ID
                        .eq(document.id())
                        .and(DOCUMENT.KIND.eq(document.kind().name())))
                .execute();
        if (updated > 0) return;
        dslContext
                .insertInto(DOCUMENT)
                .set(DOCUMENT.DOCUMENT_ID, document.id())
                .set(DOCUMENT.PROJECT_ID, document.projectId())
                .set(DOCUMENT.FACET_ID, document.facetId())
                .set(DOCUMENT.KIND, document.kind().name())
                .set(DOCUMENT.TITLE, document.title())
                .set(DOCUMENT.BODY_TEXT, document.bodyText())
                .set(DOCUMENT.VERSION, 0L)
                .set(DOCUMENT.CREATED_AT, document.createdAt())
                .set(DOCUMENT.CREATED_BY, document.authorId())
                .set(DOCUMENT.UPDATED_AT, document.updatedAt())
                .set(DOCUMENT.UPDATED_BY, document.updatedBy())
                .execute();
    }

    @Override
    public void remove(UUID id, UUID actor, Instant at) {
        dslContext
                .update(DOCUMENT)
                .set(DOCUMENT.DELETED_AT, at)
                .set(DOCUMENT.DELETED_BY, actor)
                .where(DOCUMENT.DOCUMENT_ID
                        .eq(id)
                        .and(DOCUMENT.KIND.in("MEETING", "WEEKLY_REPORT"))
                        .and(DOCUMENT.DELETED_AT.isNull()))
                .execute();
    }
}

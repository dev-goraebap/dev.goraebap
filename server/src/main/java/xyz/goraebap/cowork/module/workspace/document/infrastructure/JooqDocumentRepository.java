package xyz.goraebap.cowork.module.workspace.document.infrastructure;

import static xyz.goraebap.cowork.jooq.tables.Document.DOCUMENT;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.cowork.jooq.tables.records.DocumentRecord;
import xyz.goraebap.cowork.module.workspace.document.domain.Mark;
import xyz.goraebap.cowork.module.workspace.document.domain.document.Document;
import xyz.goraebap.cowork.module.workspace.document.domain.document.DocumentRepository;

@Repository
@RequiredArgsConstructor
class JooqDocumentRepository implements DocumentRepository {
    private final DSLContext dslContext;

    @Override
    public Optional<Document> findById(UUID id) {
        return dslContext
                .selectFrom(DOCUMENT)
                .where(DOCUMENT.DOCUMENT_ID.eq(id))
                .fetchOptional()
                .map(JooqDocumentRepository::document);
    }

    @Override
    public List<Document> findAllIncludingDeleted(Collection<UUID> ids) {
        if (ids.isEmpty()) return List.of();
        return dslContext
                .selectFrom(DOCUMENT)
                .where(DOCUMENT.DOCUMENT_ID.in(ids))
                .fetch(JooqDocumentRepository::document);
    }

    @Override
    public List<Document> findAllIncludingDeleted() {
        return dslContext
                .selectFrom(DOCUMENT)
                .where(DOCUMENT.KIND.in("PAGE", "MANUAL"))
                .fetch(JooqDocumentRepository::document);
    }

    @Override
    public List<Document> findAllById(Collection<UUID> ids) {
        if (ids.isEmpty()) return List.of();
        return dslContext
                .selectFrom(DOCUMENT)
                .where(DOCUMENT.DOCUMENT_ID.in(ids).and(DOCUMENT.DELETED_AT.isNull()))
                .fetch(JooqDocumentRepository::document);
    }

    @Override
    public boolean save(Document document, UUID actor, Instant now) {
        int updated = dslContext
                .update(DOCUMENT)
                .set(DOCUMENT.FOLDER_ID, document.folderId())
                .set(DOCUMENT.PARENT_ID, document.parentId())
                .set(DOCUMENT.TITLE, document.title())
                .set(DOCUMENT.ICON, document.mark().icon())
                .set(DOCUMENT.COLOR, document.mark().color())
                .set(DOCUMENT.DELETED_AT, document.deletedAt())
                .set(DOCUMENT.DELETED_BY, document.isDeleted() ? actor : null)
                .set(DOCUMENT.VERSION, DOCUMENT.VERSION.plus(1))
                .set(DOCUMENT.UPDATED_AT, now)
                .set(DOCUMENT.UPDATED_BY, actor)
                .where(DOCUMENT.DOCUMENT_ID.eq(document.id()).and(DOCUMENT.VERSION.eq(document.version())))
                .execute();
        if (updated > 0) return true;
        if (dslContext.fetchExists(DOCUMENT, DOCUMENT.DOCUMENT_ID.eq(document.id()))) return false;
        dslContext
                .insertInto(DOCUMENT)
                .set(DOCUMENT.DOCUMENT_ID, document.id())
                .set(DOCUMENT.PROJECT_ID, document.projectId())
                .set(DOCUMENT.FOLDER_ID, document.folderId())
                .set(DOCUMENT.PARENT_ID, document.parentId())
                .set(DOCUMENT.KIND, document.kind().name())
                .set(DOCUMENT.TITLE, document.title())
                .set(DOCUMENT.ICON, document.mark().icon())
                .set(DOCUMENT.COLOR, document.mark().color())
                .set(DOCUMENT.BODY_TEXT, "")
                .set(DOCUMENT.VERSION, 0L)
                .set(DOCUMENT.CREATED_AT, now)
                .set(DOCUMENT.CREATED_BY, document.createdBy())
                .set(DOCUMENT.UPDATED_AT, now)
                .set(DOCUMENT.UPDATED_BY, actor)
                .execute();
        return true;
    }

    @Override
    public void updateBody(UUID id, String bodyText, UUID actor, Instant now) {
        dslContext
                .update(DOCUMENT)
                .set(DOCUMENT.BODY_TEXT, bodyText)
                .set(DOCUMENT.UPDATED_AT, now)
                .set(DOCUMENT.UPDATED_BY, actor)
                .where(DOCUMENT.DOCUMENT_ID.eq(id))
                .execute();
    }

    private static Document document(DocumentRecord row) {
        return Document.fromPersistence(
                row.getDocumentId(),
                row.getProjectId(),
                row.getFolderId(),
                row.getParentId(),
                Document.Kind.valueOf(row.getKind()),
                row.getTitle(),
                new Mark(row.getIcon(), row.getColor()),
                row.getCreatedBy(),
                row.getDeletedAt(),
                row.getVersion());
    }
}

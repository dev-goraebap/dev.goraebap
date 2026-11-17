package xyz.goraebap.module.workspace.document.infrastructure;

import static xyz.goraebap.jooq.tables.Document.DOCUMENT;
import static xyz.goraebap.jooq.tables.DocumentFolder.DOCUMENT_FOLDER;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.jooq.tables.records.DocumentFolderRecord;
import xyz.goraebap.module.workspace.document.domain.Mark;
import xyz.goraebap.module.workspace.document.domain.folder.DocumentFolder;
import xyz.goraebap.module.workspace.document.domain.folder.DocumentFolderRepository;

@Repository
@RequiredArgsConstructor
class JooqDocumentFolderRepository implements DocumentFolderRepository {
    private final DSLContext dslContext;

    @Override
    public Optional<DocumentFolder> findById(UUID id) {
        return dslContext
                .selectFrom(DOCUMENT_FOLDER)
                .where(DOCUMENT_FOLDER.FOLDER_ID.eq(id))
                .fetchOptional()
                .map(JooqDocumentFolderRepository::folder);
    }

    @Override
    public List<DocumentFolder> findAllIncludingDeleted() {
        return dslContext.selectFrom(DOCUMENT_FOLDER).fetch(JooqDocumentFolderRepository::folder);
    }

    @Override
    public List<DocumentFolder> findAll() {
        return dslContext
                .selectFrom(DOCUMENT_FOLDER)
                .where(DOCUMENT_FOLDER.DELETED_AT.isNull())
                .fetch(JooqDocumentFolderRepository::folder);
    }

    @Override
    public List<DocumentFolder> findAllByProjectId(UUID projectId) {
        return dslContext
                .selectFrom(DOCUMENT_FOLDER)
                .where(inSpace(projectId).and(DOCUMENT_FOLDER.DELETED_AT.isNull()))
                .orderBy(DOCUMENT_FOLDER.NAME, DOCUMENT_FOLDER.FOLDER_ID)
                .fetch(JooqDocumentFolderRepository::folder);
    }

    @Override
    public boolean existsContentById(UUID id) {
        return dslContext.fetchExists(
                        DOCUMENT_FOLDER, DOCUMENT_FOLDER.PARENT_ID.eq(id).and(DOCUMENT_FOLDER.DELETED_AT.isNull()))
                || dslContext.fetchExists(DOCUMENT, DOCUMENT.FOLDER_ID.eq(id).and(DOCUMENT.DELETED_AT.isNull()));
    }

    @Override
    public boolean save(DocumentFolder folder, UUID actor, Instant now) {
        int updated = dslContext
                .update(DOCUMENT_FOLDER)
                .set(DOCUMENT_FOLDER.PARENT_ID, folder.parentId())
                .set(DOCUMENT_FOLDER.NAME, folder.name())
                .set(DOCUMENT_FOLDER.ICON, folder.mark().icon())
                .set(DOCUMENT_FOLDER.COLOR, folder.mark().color())
                .set(DOCUMENT_FOLDER.DELETED_AT, folder.deletedAt())
                .set(DOCUMENT_FOLDER.DELETED_BY, folder.isDeleted() ? actor : null)
                .set(DOCUMENT_FOLDER.VERSION, DOCUMENT_FOLDER.VERSION.plus(1))
                .set(DOCUMENT_FOLDER.UPDATED_AT, now)
                .set(DOCUMENT_FOLDER.UPDATED_BY, actor)
                .where(DOCUMENT_FOLDER.FOLDER_ID.eq(folder.id()).and(DOCUMENT_FOLDER.VERSION.eq(folder.version())))
                .execute();
        if (updated > 0) return true;
        if (dslContext.fetchExists(DOCUMENT_FOLDER, DOCUMENT_FOLDER.FOLDER_ID.eq(folder.id()))) return false;
        dslContext
                .insertInto(DOCUMENT_FOLDER)
                .set(DOCUMENT_FOLDER.FOLDER_ID, folder.id())
                .set(DOCUMENT_FOLDER.PROJECT_ID, folder.projectId())
                .set(DOCUMENT_FOLDER.PARENT_ID, folder.parentId())
                .set(DOCUMENT_FOLDER.NAME, folder.name())
                .set(DOCUMENT_FOLDER.ICON, folder.mark().icon())
                .set(DOCUMENT_FOLDER.COLOR, folder.mark().color())
                .set(DOCUMENT_FOLDER.VERSION, 0L)
                .set(DOCUMENT_FOLDER.CREATED_AT, now)
                .set(DOCUMENT_FOLDER.CREATED_BY, folder.createdBy())
                .set(DOCUMENT_FOLDER.UPDATED_AT, now)
                .set(DOCUMENT_FOLDER.UPDATED_BY, actor)
                .execute();
        return true;
    }

    /** A space's rows: a project's, or the shared space's, whose project is none. */
    static Condition inSpace(UUID projectId) {
        return projectId == null ? DOCUMENT_FOLDER.PROJECT_ID.isNull() : DOCUMENT_FOLDER.PROJECT_ID.eq(projectId);
    }

    private static DocumentFolder folder(DocumentFolderRecord row) {
        return DocumentFolder.fromPersistence(
                row.getFolderId(),
                row.getProjectId(),
                row.getParentId(),
                row.getName(),
                new Mark(row.getIcon(), row.getColor()),
                row.getCreatedBy(),
                row.getDeletedAt(),
                row.getVersion());
    }
}

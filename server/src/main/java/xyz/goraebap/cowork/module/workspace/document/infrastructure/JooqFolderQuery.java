package xyz.goraebap.cowork.module.workspace.document.infrastructure;

import static xyz.goraebap.cowork.jooq.tables.Document.DOCUMENT;
import static xyz.goraebap.cowork.jooq.tables.DocumentFolder.DOCUMENT_FOLDER;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.cowork.module.workspace.document.application.folder.FolderQuery;
import xyz.goraebap.cowork.module.workspace.document.application.folder.FolderViews;

/** A space's folders with how many live documents each holds itself, counted per folder so no row repeats. */
@Repository
@RequiredArgsConstructor
class JooqFolderQuery implements FolderQuery {
    private final DSLContext dslContext;

    @Override
    public List<FolderViews.FolderRow> findAll(UUID projectId) {
        var documents = DSL.selectCount()
                .from(DOCUMENT)
                .where(DOCUMENT.FOLDER_ID.eq(DOCUMENT_FOLDER.FOLDER_ID).and(DOCUMENT.DELETED_AT.isNull()))
                .asField("document_count");
        return dslContext
                .select(DOCUMENT_FOLDER.fields())
                .select(documents)
                .from(DOCUMENT_FOLDER)
                .where(JooqDocumentFolderRepository.inSpace(projectId).and(DOCUMENT_FOLDER.DELETED_AT.isNull()))
                .orderBy(DSL.lower(DOCUMENT_FOLDER.NAME), DOCUMENT_FOLDER.FOLDER_ID)
                .fetch(row -> new FolderViews.FolderRow(
                        row.get(DOCUMENT_FOLDER.FOLDER_ID),
                        row.get(DOCUMENT_FOLDER.PARENT_ID),
                        row.get(DOCUMENT_FOLDER.NAME),
                        row.get(DOCUMENT_FOLDER.ICON),
                        row.get(DOCUMENT_FOLDER.COLOR),
                        row.get("document_count", Integer.class),
                        row.get(DOCUMENT_FOLDER.CREATED_BY),
                        row.get(DOCUMENT_FOLDER.CREATED_AT),
                        row.get(DOCUMENT_FOLDER.UPDATED_AT),
                        row.get(DOCUMENT_FOLDER.VERSION)));
    }
}

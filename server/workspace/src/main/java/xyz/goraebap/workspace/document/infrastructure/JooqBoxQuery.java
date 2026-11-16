package xyz.goraebap.workspace.document.infrastructure;

import org.springframework.beans.factory.annotation.Qualifier;
import xyz.goraebap.workspace.WorkspaceDatabaseConfig;
import static xyz.goraebap.workspace.jooq.tables.Document.DOCUMENT;
import static xyz.goraebap.workspace.jooq.tables.DocumentFolder.DOCUMENT_FOLDER;
import static xyz.goraebap.workspace.jooq.tables.Project.PROJECT;
import static xyz.goraebap.workspace.jooq.tables.ProjectKey.PROJECT_KEY;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.workspace.document.application.box.BoxQuery;
import xyz.goraebap.workspace.document.application.box.BoxViews;
import xyz.goraebap.workspace.document.domain.document.Document;

/**
 * Projects read here for their folders: each with its current key, what its
 * space holds at its top counted and its latest document's writer read per project, so no row repeats.
 */
@Repository
@RequiredArgsConstructor
class JooqBoxQuery implements BoxQuery {
    @Qualifier(WorkspaceDatabaseConfig.DSL)
    private final DSLContext dslContext;

    @Override
    public List<BoxViews.ProjectFolder> findProjectFolders() {
        Field<Integer> folders = DSL.selectCount()
                .from(DOCUMENT_FOLDER)
                .where(DOCUMENT_FOLDER
                        .PROJECT_ID
                        .eq(PROJECT.PROJECT_ID)
                        .and(DOCUMENT_FOLDER.PARENT_ID.isNull())
                        .and(DOCUMENT_FOLDER.DELETED_AT.isNull()))
                .asField("folder_count");
        Field<Integer> documents = DSL.selectCount()
                .from(DOCUMENT)
                .where(DOCUMENT.PROJECT_ID
                        .eq(PROJECT.PROJECT_ID)
                        .and(DOCUMENT.FOLDER_ID.isNull())
                        .and(DOCUMENT.DELETED_AT.isNull())
                        .and(JooqDocumentQuery.WRITTEN))
                .asField("document_count");
        Field<UUID> lastBy = latest(DOCUMENT.as("latest_by").UPDATED_BY, "latest_by", "last_by");
        Field<Instant> lastAt = latest(DOCUMENT.as("latest_at").UPDATED_AT, "latest_at", "last_at");
        return dslContext
                .select(PROJECT.PROJECT_ID, PROJECT_KEY.PREFIX, PROJECT.NAME, PROJECT.ICON, PROJECT.COLOR)
                .select(PROJECT.ARCHIVED_AT, folders, documents, lastBy, lastAt)
                .from(PROJECT)
                .leftJoin(PROJECT_KEY)
                .on(PROJECT_KEY.PROJECT_ID.eq(PROJECT.PROJECT_ID).and(PROJECT_KEY.IS_CURRENT.isTrue()))
                .where(PROJECT.DELETED_AT.isNull())
                .orderBy(PROJECT.POSITION, PROJECT.NAME, PROJECT.PROJECT_ID)
                .fetch(row -> new BoxViews.ProjectFolder(
                        row.get(PROJECT.PROJECT_ID),
                        row.get(PROJECT_KEY.PREFIX),
                        row.get(PROJECT.NAME),
                        row.get(PROJECT.ICON),
                        row.get(PROJECT.COLOR),
                        row.get(PROJECT.ARCHIVED_AT) != null,
                        row.get(folders) + row.get(documents),
                        row.get(lastBy),
                        null,
                        row.get(lastAt)));
    }

    /** A field of the project's latest written live document (any folder), read with its own alias of the table. */
    private static <T> Field<T> latest(Field<T> field, String alias, String name) {
        var latest = DOCUMENT.as(alias);
        return DSL.select(field)
                .from(latest)
                .where(latest.PROJECT_ID
                        .eq(PROJECT.PROJECT_ID)
                        .and(latest.DELETED_AT.isNull())
                        .and(latest.KIND.in(Document.Kind.PAGE.name(), Document.Kind.MANUAL.name())))
                .orderBy(latest.UPDATED_AT.desc(), latest.DOCUMENT_ID.desc())
                .limit(1)
                .asField(name);
    }
}

package xyz.goraebap.workspace.document.infrastructure;

import static xyz.goraebap.workspace.jooq.tables.ActivityEntryPublic.ACTIVITY_ENTRY_PUBLIC;
import static xyz.goraebap.workspace.jooq.tables.Document.DOCUMENT;
import static xyz.goraebap.workspace.jooq.tables.DocumentFolder.DOCUMENT_FOLDER;
import static xyz.goraebap.workspace.jooq.tables.ManualChapter.MANUAL_CHAPTER;
import static xyz.goraebap.workspace.jooq.tables.ProjectPublic.PROJECT_PUBLIC;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.SelectFieldOrAsterisk;
import org.jooq.SelectOnConditionStep;
import org.jooq.SortField;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.workspace.activity.ActivityEntry;
import xyz.goraebap.workspace.document.application.body.DocumentBodyOwner;
import xyz.goraebap.workspace.document.application.document.DocumentQuery;
import xyz.goraebap.workspace.document.application.document.DocumentRequests;
import xyz.goraebap.workspace.document.application.document.DocumentViews;
import xyz.goraebap.workspace.document.domain.document.Document;
import xyz.goraebap.foundation.shared.web.Keyset;
import xyz.goraebap.foundation.shared.web.SortDirection;

/**
 * Documents joined with their folder and, for a project's, the project, whose current key and name each row shows; the
 * project is read here to leave out deleted projects' documents. A document
 * has at most one folder, one project and one current key, so no row repeats.
 */
@Repository
@RequiredArgsConstructor
class JooqDocumentQuery implements DocumentQuery {
    /** How much of a body's text a row carries as its excerpt. */
    private static final int EXCERPT = 200;

    private static final Field<String> EXCERPT_TEXT =
            DSL.substring(DOCUMENT.BODY_TEXT, 1, EXCERPT).as("excerpt");

    /** How many live chapters a 매뉴얼 holds, counted per document so no row repeats. */
    private static final Field<Integer> CHAPTER_COUNT = DSL.selectCount()
            .from(MANUAL_CHAPTER)
            .where(MANUAL_CHAPTER.DOCUMENT_ID.eq(DOCUMENT.DOCUMENT_ID).and(MANUAL_CHAPTER.DELETED_AT.isNull()))
            .asField("chapter_count");

    private final DSLContext dslContext;

    /**
     * The documents whose body or metadata changed in the window, or that got a live comment or reply in it, the latest
     * moment of either first. A document's comments are its body's activity (owner PROJECT_DOCUMENT), read here as the
     * project is, to page them with the documents in one keyset.
     */
    @Override
    public ChangeSlice changes(Filter filter, Instant since, Instant until, String cursor, int size) {
        Condition comments = ACTIVITY_ENTRY_PUBLIC
                .OWNER_TYPE
                .eq(DocumentBodyOwner.TYPE)
                .and(ACTIVITY_ENTRY_PUBLIC.OWNER_ID.eq(DOCUMENT.DOCUMENT_ID))
                .and(ACTIVITY_ENTRY_PUBLIC.KIND.eq(ActivityEntry.Kind.COMMENT.name()))
                .and(ACTIVITY_ENTRY_PUBLIC.DELETED_AT.isNull())
                .and(ACTIVITY_ENTRY_PUBLIC.CREATED_AT.gt(since))
                .and(ACTIVITY_ENTRY_PUBLIC.CREATED_AT.le(until));
        var lastComment = DSL.select(DSL.max(ACTIVITY_ENTRY_PUBLIC.CREATED_AT))
                .from(ACTIVITY_ENTRY_PUBLIC)
                .where(comments)
                .asField(COMMENTED_AT);
        var bodyChanged = DOCUMENT.UPDATED_AT.gt(since).and(DOCUMENT.UPDATED_AT.le(until));
        var found = dslContext
                .select(
                        DOCUMENT.DOCUMENT_ID,
                        PROJECT_PUBLIC.PREFIX,
                        DOCUMENT.TITLE,
                        DOCUMENT.CREATED_AT,
                        DOCUMENT.UPDATED_AT,
                        DOCUMENT.DELETED_AT,
                        lastComment)
                .from(DOCUMENT)
                .leftJoin(PROJECT_PUBLIC)
                .on(PROJECT_PUBLIC.PROJECT_ID.eq(DOCUMENT.PROJECT_ID))
                .leftJoin(DOCUMENT_FOLDER)
                .on(DOCUMENT_FOLDER.FOLDER_ID.eq(DOCUMENT.FOLDER_ID))
                .where(conditions(filter, true)
                        .and(bodyChanged.or(
                                DSL.exists(DSL.selectOne().from(ACTIVITY_ENTRY_PUBLIC).where(comments)))))
                .asTable("found");
        var updated = column(found.getName(), DOCUMENT.UPDATED_AT);
        var commented = DSL.field(DSL.name(found.getName(), COMMENTED_AT), DOCUMENT.UPDATED_AT.getDataType());
        var epoch = DSL.val(Instant.EPOCH, DOCUMENT.UPDATED_AT);
        Field<Instant> bodyAt = DSL.when(updated.gt(since).and(updated.le(until)), updated);
        var moment = DSL.greatest(DSL.coalesce(bodyAt, epoch), DSL.coalesce(commented, epoch))
                .as(CHANGED_AT);
        var changed = dslContext.select(found.asterisk(), moment).from(found).asTable("changed");
        String at = changed.getName();
        var changedAt = DSL.field(DSL.name(at, CHANGED_AT), DOCUMENT.UPDATED_AT.getDataType());
        var id = column(at, DOCUMENT.DOCUMENT_ID);
        var keys = List.<Field<?>>of(changedAt, id);
        var ordered = dslContext.selectFrom(changed).orderBy(List.of(changedAt.desc(), id.desc()));
        var fetched = cursor == null
                ? ordered.limit(size + 1).fetch()
                : ordered.seek(Keyset.after(cursor, "document-changes", keys))
                        .limit(size + 1)
                        .fetch();
        var shown = fetched.size() > size ? fetched.subList(0, size) : fetched;
        return new ChangeSlice(
                shown.stream()
                        .map(row -> new Change(
                                row.get(id),
                                row.get(column(at, PROJECT_PUBLIC.PREFIX)),
                                row.get(column(at, DOCUMENT.TITLE)),
                                row.get(column(at, DOCUMENT.CREATED_AT)),
                                row.get(column(at, DOCUMENT.UPDATED_AT)),
                                row.get(column(at, DOCUMENT.DELETED_AT)),
                                row.get(DSL.field(DSL.name(at, COMMENTED_AT), DOCUMENT.UPDATED_AT.getDataType()))))
                        .toList(),
                fetched.size() > size ? Keyset.next("document-changes", shown.getLast(), keys) : null);
    }

    private static final String COMMENTED_AT = "commented_at";
    private static final String CHANGED_AT = "changed_at";

    /** A column of a derived table, by the table's name and the column it carries over. */
    private static <T> Field<T> column(String table, Field<T> source) {
        return DSL.field(DSL.name(table, source.getName()), source.getDataType());
    }

    @Override
    public Slice findAll(Filter filter, String cursor, int size) {
        var keys = keys(filter.sort());
        String sort = filter.direction().cursorName(filter.sort());
        var ordered = select().where(conditions(filter)).orderBy(order(keys, filter.direction()));
        var fetched = cursor == null
                ? ordered.limit(size + 1).fetch()
                : ordered.seek(Keyset.after(cursor, sort, keys)).limit(size + 1).fetch();
        var shown = fetched.size() > size ? fetched.subList(0, size) : fetched;
        String next = fetched.size() > size ? Keyset.next(sort, shown.getLast(), keys) : null;
        return new Slice(shown.stream().map(JooqDocumentQuery::row).toList(), next);
    }

    @Override
    public Optional<DocumentViews.DocumentRow> findRow(UUID documentId) {
        return select().where(live().and(DOCUMENT.DOCUMENT_ID.eq(documentId)))
                .fetchOptional()
                .map(JooqDocumentQuery::row);
    }

    private SelectOnConditionStep<Record> select() {
        return dslContext
                .select(List.<SelectFieldOrAsterisk>of(
                        DOCUMENT.DOCUMENT_ID,
                        DOCUMENT.PROJECT_ID,
                        DOCUMENT.FOLDER_ID,
                        DOCUMENT.PARENT_ID,
                        DOCUMENT.KIND,
                        DOCUMENT.TITLE,
                        DOCUMENT.ICON,
                        DOCUMENT.COLOR,
                        CHAPTER_COUNT,
                        DOCUMENT.CREATED_AT,
                        DOCUMENT.CREATED_BY,
                        DOCUMENT.UPDATED_AT,
                        DOCUMENT.UPDATED_BY,
                        DOCUMENT.VERSION,
                        EXCERPT_TEXT,
                        PROJECT_PUBLIC.NAME,
                        PROJECT_PUBLIC.PREFIX,
                        DOCUMENT_FOLDER.NAME))
                .from(DOCUMENT)
                .leftJoin(PROJECT_PUBLIC)
                .on(PROJECT_PUBLIC.PROJECT_ID.eq(DOCUMENT.PROJECT_ID))
                .leftJoin(DOCUMENT_FOLDER)
                .on(DOCUMENT_FOLDER.FOLDER_ID.eq(DOCUMENT.FOLDER_ID));
    }

    /** A live document written in 문서함 (not a system folder's row), in the shared space or a live project's. */
    private static Condition live() {
        return DOCUMENT.DELETED_AT
                .isNull()
                .and(WRITTEN)
                .and(DOCUMENT.PROJECT_ID.isNull().or(PROJECT_PUBLIC.DELETED_AT.isNull()));
    }

    /** Documents written in 문서함: pages and 매뉴얼, not the rows of meetings and weekly reports. */
    static final Condition WRITTEN = DOCUMENT.KIND.in(Document.Kind.PAGE.name(), Document.Kind.MANUAL.name());

    private static Condition conditions(Filter filter) {
        return conditions(filter, false);
    }

    private static Condition conditions(Filter filter, boolean includesDeleted) {
        var condition =
                includesDeleted ? WRITTEN.and(DOCUMENT.PROJECT_ID.isNull().or(PROJECT_PUBLIC.DELETED_AT.isNull())) : live();
        if (filter.projectId() != null) condition = condition.and(DOCUMENT.PROJECT_ID.eq(filter.projectId()));
        else if (filter.shared()) condition = condition.and(DOCUMENT.PROJECT_ID.isNull());
        if (filter.folderId() != null) condition = condition.and(DOCUMENT.FOLDER_ID.eq(filter.folderId()));
        else if (filter.top()) condition = condition.and(DOCUMENT.FOLDER_ID.isNull());
        if (!filter.hiddenFolderIds().isEmpty())
            condition =
                    condition.and(DOCUMENT.FOLDER_ID.isNull().or(DOCUMENT.FOLDER_ID.notIn(filter.hiddenFolderIds())));
        if (!filter.hiddenDocumentIds().isEmpty())
            condition = condition.and(DOCUMENT.DOCUMENT_ID.notIn(filter.hiddenDocumentIds()));
        if (filter.q() != null) {
            String pattern = "%" + escapeLike(filter.q()) + "%";
            condition = condition.and(
                    DOCUMENT.TITLE.likeIgnoreCase(pattern, '\\').or(DOCUMENT.BODY_TEXT.likeIgnoreCase(pattern, '\\')));
        }
        return condition;
    }

    private static List<Field<?>> keys(DocumentRequests.Sort sort) {
        return switch (sort) {
            case UPDATED -> List.of(DOCUMENT.UPDATED_AT, DOCUMENT.DOCUMENT_ID);
            case CREATED -> List.of(DOCUMENT.CREATED_AT, DOCUMENT.DOCUMENT_ID);
            case TITLE -> List.of(DOCUMENT.TITLE, DOCUMENT.DOCUMENT_ID);
        };
    }

    private static List<SortField<?>> order(List<Field<?>> keys, SortDirection direction) {
        return keys.stream()
                .<SortField<?>>map(key -> direction == SortDirection.ASC ? key.asc() : key.desc())
                .toList();
    }

    private static DocumentViews.DocumentRow row(Record row) {
        return new DocumentViews.DocumentRow(
                row.get(DOCUMENT.DOCUMENT_ID),
                row.get(DOCUMENT.PROJECT_ID),
                row.get(PROJECT_PUBLIC.PREFIX),
                row.get(PROJECT_PUBLIC.NAME),
                row.get(DOCUMENT.FOLDER_ID),
                row.get(DOCUMENT_FOLDER.NAME),
                Document.Kind.valueOf(row.get(DOCUMENT.KIND)),
                row.get(DOCUMENT.TITLE),
                row.get(DOCUMENT.ICON),
                row.get(DOCUMENT.COLOR),
                row.get(CHAPTER_COUNT),
                row.get(EXCERPT_TEXT),
                row.get(DOCUMENT.CREATED_BY),
                null,
                row.get(DOCUMENT.UPDATED_BY),
                null,
                row.get(DOCUMENT.CREATED_AT),
                row.get(DOCUMENT.UPDATED_AT),
                row.get(DOCUMENT.VERSION),
                row.get(DOCUMENT.PARENT_ID));
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}

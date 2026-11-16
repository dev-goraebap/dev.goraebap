package xyz.goraebap.workspace.document.infrastructure;

import static xyz.goraebap.workspace.jooq.tables.Document.DOCUMENT;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.workspace.document.SystemKind;
import xyz.goraebap.workspace.document.SystemReachSpi.Reach;
import xyz.goraebap.workspace.document.application.system.SystemFolderQuery;

@Repository
@RequiredArgsConstructor
class JooqSystemFolderQuery implements SystemFolderQuery {
    private final DSLContext dslContext;

    @Override
    public List<Row> findPage(
            SystemKind kind, Reach reach, UUID reader, UUID projectId, UUID facetId, int offset, int limit) {
        var condition = seen(kind, reach, reader, projectId);
        if (facetId != null) condition = condition.and(DOCUMENT.FACET_ID.eq(facetId));
        return dslContext
                .select(DOCUMENT.DOCUMENT_ID, DOCUMENT.TITLE, DOCUMENT.FACET_ID, DOCUMENT.CREATED_BY)
                .select(DOCUMENT.UPDATED_BY, DOCUMENT.UPDATED_AT)
                .from(DOCUMENT)
                .where(condition)
                .orderBy(DOCUMENT.UPDATED_AT.desc(), DOCUMENT.DOCUMENT_ID.desc())
                .limit(limit)
                .offset(offset)
                .fetch(row -> new Row(
                        row.get(DOCUMENT.DOCUMENT_ID),
                        row.get(DOCUMENT.TITLE),
                        row.get(DOCUMENT.FACET_ID),
                        row.get(DOCUMENT.CREATED_BY),
                        row.get(DOCUMENT.UPDATED_BY),
                        row.get(DOCUMENT.UPDATED_AT)));
    }

    @Override
    public List<FacetCount> countFacets(SystemKind kind, Reach reach, UUID reader, UUID projectId) {
        var count = DSL.count();
        return dslContext
                .select(DOCUMENT.FACET_ID, count)
                .from(DOCUMENT)
                .where(seen(kind, reach, reader, projectId).and(DOCUMENT.FACET_ID.isNotNull()))
                .groupBy(DOCUMENT.FACET_ID)
                .fetch(row -> new FacetCount(row.get(DOCUMENT.FACET_ID), row.get(count)));
    }

    @Override
    public Summary summarize(SystemKind kind, Reach reach, UUID reader, UUID projectId) {
        var condition = seen(kind, reach, reader, projectId);
        int total = dslContext.fetchCount(DOCUMENT, condition);
        return dslContext
                .select(DOCUMENT.UPDATED_BY, DOCUMENT.UPDATED_AT)
                .from(DOCUMENT)
                .where(condition)
                .orderBy(DOCUMENT.UPDATED_AT.desc(), DOCUMENT.DOCUMENT_ID.desc())
                .limit(1)
                .fetchOptional(row -> new Summary(total, row.get(DOCUMENT.UPDATED_BY), row.get(DOCUMENT.UPDATED_AT)))
                .orElse(new Summary(total, null, null));
    }

    /** The kind's live rows the member sees: everyone's, those of their facets, or their own; for one project if given. */
    private static Condition seen(SystemKind kind, Reach reach, UUID reader, UUID projectId) {
        var condition = DOCUMENT.KIND.eq(kind.name()).and(DOCUMENT.DELETED_AT.isNull());
        if (!reach.everyone())
            condition = condition.and(
                    reach.facets().isEmpty()
                            ? DOCUMENT.CREATED_BY.eq(reader)
                            : DOCUMENT.CREATED_BY.eq(reader).or(DOCUMENT.FACET_ID.in(reach.facets())));
        if (projectId != null) condition = condition.and(DOCUMENT.PROJECT_ID.eq(projectId));
        return condition;
    }
}

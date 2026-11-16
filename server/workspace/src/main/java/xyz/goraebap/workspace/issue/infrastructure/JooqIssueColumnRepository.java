package xyz.goraebap.workspace.issue.infrastructure;

import static xyz.goraebap.workspace.jooq.tables.IssueColumn.ISSUE_COLUMN;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Query;
import org.springframework.stereotype.Repository;
import xyz.goraebap.workspace.jooq.tables.records.IssueColumnRecord;
import xyz.goraebap.workspace.issue.domain.board.ColumnCategory;
import xyz.goraebap.workspace.issue.domain.board.IssueColumn;
import xyz.goraebap.workspace.issue.domain.board.IssueColumnRepository;

@Repository
@RequiredArgsConstructor
class JooqIssueColumnRepository implements IssueColumnRepository {
    private final DSLContext dslContext;

    @Override
    public List<IssueColumn> findAllByProjectId(UUID projectId) {
        return dslContext
                .selectFrom(ISSUE_COLUMN)
                .where(ISSUE_COLUMN.PROJECT_ID.eq(projectId))
                .orderBy(ISSUE_COLUMN.POSITION, ISSUE_COLUMN.COLUMN_ID)
                .fetch(JooqIssueColumnRepository::column);
    }

    @Override
    public Optional<IssueColumn> findById(UUID id) {
        return dslContext
                .selectFrom(ISSUE_COLUMN)
                .where(ISSUE_COLUMN.COLUMN_ID.eq(id))
                .fetchOptional(JooqIssueColumnRepository::column);
    }

    @Override
    public void saveAll(List<IssueColumn> columns, UUID actor, Instant now) {
        var queries = new ArrayList<Query>();
        for (var column : columns)
            queries.add(dslContext
                    .insertInto(ISSUE_COLUMN)
                    .set(ISSUE_COLUMN.COLUMN_ID, column.id())
                    .set(ISSUE_COLUMN.PROJECT_ID, column.projectId())
                    .set(ISSUE_COLUMN.NAME, column.name())
                    .set(ISSUE_COLUMN.CATEGORY, column.category().name())
                    .set(ISSUE_COLUMN.POSITION, column.position())
                    .set(ISSUE_COLUMN.CREATED_AT, now)
                    .set(ISSUE_COLUMN.CREATED_BY, actor)
                    .set(ISSUE_COLUMN.UPDATED_AT, now)
                    .set(ISSUE_COLUMN.UPDATED_BY, actor)
                    .onConflict(ISSUE_COLUMN.COLUMN_ID)
                    .doUpdate()
                    .set(ISSUE_COLUMN.NAME, column.name())
                    .set(ISSUE_COLUMN.CATEGORY, column.category().name())
                    .set(ISSUE_COLUMN.POSITION, column.position())
                    .set(ISSUE_COLUMN.UPDATED_AT, now)
                    .set(ISSUE_COLUMN.UPDATED_BY, actor));
        if (!queries.isEmpty()) dslContext.batch(queries).execute();
    }

    @Override
    public void deleteById(UUID id) {
        dslContext.deleteFrom(ISSUE_COLUMN).where(ISSUE_COLUMN.COLUMN_ID.eq(id)).execute();
    }

    private static IssueColumn column(IssueColumnRecord row) {
        return IssueColumn.fromPersistence(
                row.getColumnId(),
                row.getProjectId(),
                row.getName(),
                ColumnCategory.valueOf(row.getCategory()),
                row.getPosition());
    }
}

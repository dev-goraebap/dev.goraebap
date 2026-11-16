package xyz.goraebap.workspace.issue.infrastructure;

import static xyz.goraebap.workspace.jooq.tables.IssueColumn.ISSUE_COLUMN;
import static xyz.goraebap.workspace.jooq.tables.Project.PROJECT;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.workspace.issue.application.board.BoardQuery;
import xyz.goraebap.workspace.issue.application.board.BoardViews;
import xyz.goraebap.workspace.issue.domain.board.ColumnCategory;

@Repository
@RequiredArgsConstructor
class JooqBoardQuery implements BoardQuery {
    private final DSLContext dslContext;

    @Override
    public List<BoardViews.ColumnView> workspaceColumns() {
        return dslContext
                .select(ISSUE_COLUMN.COLUMN_ID, ISSUE_COLUMN.NAME, ISSUE_COLUMN.CATEGORY, ISSUE_COLUMN.POSITION)
                .from(ISSUE_COLUMN)
                .join(PROJECT)
                .on(PROJECT.PROJECT_ID.eq(ISSUE_COLUMN.PROJECT_ID))
                .where(PROJECT.DELETED_AT.isNull())
                .orderBy(ISSUE_COLUMN.POSITION, ISSUE_COLUMN.NAME, ISSUE_COLUMN.COLUMN_ID)
                .fetch(row -> new BoardViews.ColumnView(
                        row.value1(), row.value2(), ColumnCategory.valueOf(row.value3()), row.value4()));
    }
}

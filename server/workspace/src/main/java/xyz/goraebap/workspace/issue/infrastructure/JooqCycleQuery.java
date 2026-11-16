package xyz.goraebap.workspace.issue.infrastructure;

import org.springframework.beans.factory.annotation.Qualifier;
import xyz.goraebap.workspace.WorkspaceDatabaseConfig;
import static xyz.goraebap.workspace.jooq.tables.Issue.ISSUE;
import static xyz.goraebap.workspace.jooq.tables.IssueColumn.ISSUE_COLUMN;
import static xyz.goraebap.workspace.jooq.tables.IssueTimeEntry.ISSUE_TIME_ENTRY;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.workspace.issue.application.cycle.CycleModels;
import xyz.goraebap.workspace.issue.application.cycle.CycleQuery;
import xyz.goraebap.workspace.issue.domain.board.ColumnCategory;

@Repository
@RequiredArgsConstructor
class JooqCycleQuery implements CycleQuery {
    @Qualifier(WorkspaceDatabaseConfig.DSL)
    private final DSLContext dslContext;

    @Override
    public Map<UUID, CycleModels.Totals> totals(UUID projectId) {
        var done = ISSUE_COLUMN.CATEGORY.eq(ColumnCategory.COMPLETED.name());
        var dropped = ISSUE_COLUMN.CATEGORY.eq(ColumnCategory.CANCELED.name());
        var spent = DSL.select(DSL.coalesce(DSL.sum(ISSUE_TIME_ENTRY.MINUTES), BigDecimal.ZERO))
                .from(ISSUE_TIME_ENTRY)
                .where(ISSUE_TIME_ENTRY.ISSUE_ID.eq(ISSUE.ISSUE_ID))
                .asField("spent");
        var rows = dslContext
                .select(
                        ISSUE.CYCLE_ID,
                        ISSUE.STORY_POINTS,
                        ISSUE.ESTIMATE_MINUTES,
                        done.as("done"),
                        dropped.as("dropped"),
                        spent)
                .from(ISSUE)
                .join(ISSUE_COLUMN)
                .on(ISSUE_COLUMN.COLUMN_ID.eq(ISSUE.COLUMN_ID))
                .where(ISSUE.PROJECT_ID.eq(projectId))
                .and(ISSUE.CYCLE_ID.isNotNull())
                .and(ISSUE.DELETED_AT.isNull())
                .fetch();
        var sums = new HashMap<UUID, double[]>();
        for (var row : rows) {
            var sum = sums.computeIfAbsent(row.get(ISSUE.CYCLE_ID), unused -> new double[7]);
            boolean isDone = Boolean.TRUE.equals(row.get("done", Boolean.class));
            double points = row.get(ISSUE.STORY_POINTS) == null ? 0 : row.get(ISSUE.STORY_POINTS);
            sum[0]++;
            if (isDone) sum[1]++;
            if (Boolean.TRUE.equals(row.get("dropped", Boolean.class))) sum[2]++;
            sum[3] += points;
            if (isDone) sum[4] += points;
            sum[5] += row.get(ISSUE.ESTIMATE_MINUTES) == null ? 0 : row.get(ISSUE.ESTIMATE_MINUTES);
            sum[6] += row.get("spent", Integer.class) == null ? 0 : row.get("spent", Integer.class);
        }
        var totals = new HashMap<UUID, CycleModels.Totals>();
        sums.forEach((id, sum) -> totals.put(
                id,
                new CycleModels.Totals(
                        (int) sum[0], (int) sum[1], (int) sum[2], sum[3], sum[4], hours(sum[5]), hours(sum[6]))));
        return totals;
    }

    private static double hours(double minutes) {
        return Math.round(minutes / 60.0 * 100) / 100.0;
    }
}

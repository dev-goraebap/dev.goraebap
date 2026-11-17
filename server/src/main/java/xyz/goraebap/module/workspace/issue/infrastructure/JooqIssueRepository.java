package xyz.goraebap.module.workspace.issue.infrastructure;

import static xyz.goraebap.jooq.tables.Issue.ISSUE;
import static xyz.goraebap.jooq.tables.IssueLabelLink.ISSUE_LABEL_LINK;

import java.time.Instant;
import java.util.HashSet;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.jooq.tables.records.IssueRecord;
import xyz.goraebap.module.workspace.issue.domain.issue.Issue;
import xyz.goraebap.module.workspace.issue.domain.issue.IssuePriority;
import xyz.goraebap.module.workspace.issue.domain.issue.IssueRepository;

@Repository
@RequiredArgsConstructor
class JooqIssueRepository implements IssueRepository {
    private final DSLContext dslContext;

    @Override
    public Optional<Issue> findById(UUID id) {
        return find(ISSUE.ISSUE_ID.eq(id));
    }

    @Override
    public Optional<Issue> findByProjectIdAndNumber(UUID projectId, long number) {
        return find(ISSUE.PROJECT_ID.eq(projectId).and(ISSUE.NUMBER.eq(number)));
    }

    @Override
    public Optional<UUID> findParentIdById(UUID id) {
        return dslContext
                .select(ISSUE.PARENT_ID)
                .from(ISSUE)
                .where(ISSUE.ISSUE_ID.eq(id))
                .fetchOptional(ISSUE.PARENT_ID);
    }

    @Override
    public boolean existsByColumnId(UUID columnId) {
        return dslContext.fetchExists(ISSUE, ISSUE.COLUMN_ID.eq(columnId).and(ISSUE.DELETED_AT.isNull()));
    }

    @Override
    public void updateClosedByColumnId(UUID columnId, boolean closes, Instant now) {
        if (closes)
            dslContext
                    .update(ISSUE)
                    .set(ISSUE.CLOSED_AT, now)
                    .where(ISSUE.COLUMN_ID.eq(columnId).and(ISSUE.CLOSED_AT.isNull()))
                    .execute();
        else
            dslContext
                    .update(ISSUE)
                    .setNull(ISSUE.CLOSED_AT)
                    .where(ISSUE.COLUMN_ID.eq(columnId).and(ISSUE.CLOSED_AT.isNotNull()))
                    .execute();
    }

    @Override
    public void updateColumnOfDeleted(UUID fromColumnId, UUID toColumnId) {
        dslContext
                .update(ISSUE)
                .set(ISSUE.COLUMN_ID, toColumnId)
                .where(ISSUE.COLUMN_ID.eq(fromColumnId).and(ISSUE.DELETED_AT.isNotNull()))
                .execute();
    }

    @Override
    public Optional<Double> findFirstPositionByColumnId(UUID columnId, UUID excluding) {
        return dslContext
                .select(ISSUE.POSITION)
                .from(ISSUE)
                .where(placed(columnId, excluding))
                .orderBy(ISSUE.POSITION.asc(), ISSUE.ISSUE_ID.asc())
                .limit(1)
                .fetchOptional(ISSUE.POSITION);
    }

    @Override
    public Optional<Double> findLastPositionByColumnId(UUID columnId, UUID excluding) {
        return dslContext
                .select(ISSUE.POSITION)
                .from(ISSUE)
                .where(placed(columnId, excluding))
                .orderBy(ISSUE.POSITION.desc(), ISSUE.ISSUE_ID.desc())
                .limit(1)
                .fetchOptional(ISSUE.POSITION);
    }

    @Override
    public Optional<Double> findPositionAfter(UUID columnId, double position, UUID excluding) {
        return dslContext
                .select(ISSUE.POSITION)
                .from(ISSUE)
                .where(placed(columnId, excluding).and(ISSUE.POSITION.gt(position)))
                .orderBy(ISSUE.POSITION.asc(), ISSUE.ISSUE_ID.asc())
                .limit(1)
                .fetchOptional(ISSUE.POSITION);
    }

    private static Condition placed(UUID columnId, UUID excluding) {
        var condition = ISSUE.COLUMN_ID.eq(columnId).and(ISSUE.DELETED_AT.isNull());
        return excluding == null ? condition : condition.and(ISSUE.ISSUE_ID.ne(excluding));
    }

    @Override
    public boolean save(Issue issue, UUID actor, Instant now) {
        var details = issue.details();
        int updated = dslContext
                .update(ISSUE)
                .set(ISSUE.TITLE, details.title())
                .set(ISSUE.TYPE, details.type())
                .set(ISSUE.PRIORITY, details.priority().name())
                .set(ISSUE.ASSIGNEE_ID, details.assigneeId())
                .set(ISSUE.START_DATE, details.startDate())
                .set(ISSUE.DUE_DATE, details.dueDate())
                .set(ISSUE.PARENT_ID, details.parentId())
                .set(ISSUE.ESTIMATE_MINUTES, details.estimateMinutes())
                .set(ISSUE.STORY_POINTS, details.storyPoints())
                .set(ISSUE.CYCLE_ID, details.cycleId())
                .set(ISSUE.COLUMN_ID, issue.columnId())
                .set(ISSUE.POSITION, issue.position())
                .set(ISSUE.STARTED_AT, issue.startedAt())
                .set(ISSUE.CLOSED_AT, issue.closedAt())
                .set(ISSUE.DELETED_AT, issue.deletedAt())
                .set(ISSUE.DELETED_BY, issue.isDeleted() ? actor : null)
                .set(ISSUE.VERSION, ISSUE.VERSION.plus(1))
                .set(ISSUE.UPDATED_AT, now)
                .set(ISSUE.UPDATED_BY, actor)
                .where(ISSUE.ISSUE_ID.eq(issue.id()).and(ISSUE.VERSION.eq(issue.version())))
                .execute();
        if (updated == 0) {
            if (dslContext.fetchExists(ISSUE, ISSUE.ISSUE_ID.eq(issue.id()))) return false;
            dslContext
                    .insertInto(ISSUE)
                    .set(ISSUE.ISSUE_ID, issue.id())
                    .set(ISSUE.PROJECT_ID, issue.projectId())
                    .set(ISSUE.NUMBER, issue.number())
                    .set(ISSUE.TITLE, details.title())
                    .set(ISSUE.TYPE, details.type())
                    .set(ISSUE.PRIORITY, details.priority().name())
                    .set(ISSUE.ASSIGNEE_ID, details.assigneeId())
                    .set(ISSUE.START_DATE, details.startDate())
                    .set(ISSUE.DUE_DATE, details.dueDate())
                    .set(ISSUE.PARENT_ID, details.parentId())
                    .set(ISSUE.ESTIMATE_MINUTES, details.estimateMinutes())
                    .set(ISSUE.STORY_POINTS, details.storyPoints())
                    .set(ISSUE.CYCLE_ID, details.cycleId())
                    .set(ISSUE.COLUMN_ID, issue.columnId())
                    .set(ISSUE.POSITION, issue.position())
                    .set(ISSUE.STARTED_AT, issue.startedAt())
                    .set(ISSUE.CLOSED_AT, issue.closedAt())
                    .set(ISSUE.VERSION, 0L)
                    .set(ISSUE.CREATED_AT, now)
                    .set(ISSUE.CREATED_BY, actor)
                    .set(ISSUE.UPDATED_AT, now)
                    .set(ISSUE.UPDATED_BY, actor)
                    .execute();
        }
        saveLabels(issue, actor, now);
        return true;
    }

    /** The issue's labels made exactly its details' labels: the ones taken off removed, the new ones added. */
    private void saveLabels(Issue issue, UUID actor, Instant now) {
        var wanted = issue.details().labelIds();
        dslContext
                .deleteFrom(ISSUE_LABEL_LINK)
                .where(ISSUE_LABEL_LINK.ISSUE_ID.eq(issue.id()))
                .and(wanted.isEmpty() ? DSL.trueCondition() : ISSUE_LABEL_LINK.LABEL_ID.notIn(wanted))
                .execute();
        if (wanted.isEmpty()) return;
        var insert = dslContext.insertInto(
                ISSUE_LABEL_LINK,
                ISSUE_LABEL_LINK.ISSUE_ID,
                ISSUE_LABEL_LINK.LABEL_ID,
                ISSUE_LABEL_LINK.CREATED_AT,
                ISSUE_LABEL_LINK.CREATED_BY);
        for (UUID label : wanted) insert = insert.values(issue.id(), label, now, actor);
        insert.onConflictDoNothing().execute();
    }

    @Override
    public java.util.List<Issue> findAllByCycleId(UUID cycleId) {
        return dslContext
                .selectFrom(ISSUE)
                .where(ISSUE.CYCLE_ID.eq(cycleId).and(ISSUE.DELETED_AT.isNull()))
                .fetch()
                .map(this::issue);
    }

    private Optional<Issue> find(Condition condition) {
        return dslContext.selectFrom(ISSUE).where(condition).fetchOptional().map(this::issue);
    }

    private Issue issue(IssueRecord row) {
        var labels = new HashSet<>(dslContext
                .select(ISSUE_LABEL_LINK.LABEL_ID)
                .from(ISSUE_LABEL_LINK)
                .where(ISSUE_LABEL_LINK.ISSUE_ID.eq(row.getIssueId()))
                .fetch(ISSUE_LABEL_LINK.LABEL_ID));
        return Issue.fromPersistence(
                row.getIssueId(),
                row.getProjectId(),
                row.getNumber(),
                new Issue.Details(
                        row.getTitle(),
                        row.getType(),
                        IssuePriority.valueOf(row.getPriority()),
                        row.getAssigneeId(),
                        row.getStartDate(),
                        row.getDueDate(),
                        row.getParentId(),
                        labels,
                        row.getEstimateMinutes(),
                        row.getStoryPoints(),
                        row.getCycleId()),
                row.getColumnId(),
                row.getPosition(),
                row.getStartedAt(),
                row.getClosedAt(),
                row.getDeletedAt(),
                row.getVersion());
    }
}

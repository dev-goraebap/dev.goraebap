package xyz.goraebap.workspace.issue.infrastructure;

import org.springframework.beans.factory.annotation.Qualifier;
import xyz.goraebap.workspace.WorkspaceDatabaseConfig;
import static xyz.goraebap.workspace.jooq.Tables.ISSUE;
import static xyz.goraebap.workspace.jooq.Tables.ISSUE_CYCLE;
import static xyz.goraebap.workspace.jooq.Tables.ISSUE_TIME_ENTRY;
import static xyz.goraebap.workspace.jooq.tables.CodeLink.CODE_LINK;
import static xyz.goraebap.workspace.jooq.tables.IssueColumn.ISSUE_COLUMN;
import static xyz.goraebap.workspace.jooq.tables.IssueLabel.ISSUE_LABEL;
import static xyz.goraebap.workspace.jooq.tables.IssueLabelLink.ISSUE_LABEL_LINK;
import static xyz.goraebap.workspace.jooq.tables.Project.PROJECT;
import static xyz.goraebap.workspace.jooq.tables.ProjectKey.PROJECT_KEY;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.SelectOnConditionStep;
import org.jooq.SortField;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.workspace.issue.application.issue.IssueQuery;
import xyz.goraebap.workspace.issue.application.issue.IssueRequests;
import xyz.goraebap.workspace.issue.application.issue.IssueViews;
import xyz.goraebap.workspace.issue.domain.board.ColumnCategory;
import xyz.goraebap.workspace.issue.domain.issue.IssuePriority;
import xyz.goraebap.foundation.shared.web.Keyset;
import xyz.goraebap.foundation.shared.web.SortDirection;

/**
 * Issues joined with their column and their project, whose current key and name each row shows; the project is read
 * here to leave out deleted projects' issues and to order by its place. Each
 * issue has one column, one project and one current key, so no row repeats. Labels and child counts are per issue.
 */
@Repository
@RequiredArgsConstructor
class JooqIssueQuery implements IssueQuery {
    private static final Pattern REF = Pattern.compile("^([A-Za-z0-9]{2,10})-(\\d{1,12})$");
    private static final Pattern NUMBER = Pattern.compile("^#?(\\d{1,12})$");
    private static final xyz.goraebap.workspace.jooq.tables.Issue CHILD = ISSUE.as("child");

    @Qualifier(WorkspaceDatabaseConfig.DSL)
    private final DSLContext dslContext;

    @Override
    public ChangeSlice changes(List<UUID> projectIds, Instant since, Instant until, String cursor, int size) {
        var keys = List.<Field<?>>of(ISSUE.UPDATED_AT, ISSUE.ISSUE_ID);
        var condition =
                PROJECT.DELETED_AT.isNull().and(ISSUE.UPDATED_AT.gt(since)).and(ISSUE.UPDATED_AT.le(until));
        if (!projectIds.isEmpty()) condition = condition.and(ISSUE.PROJECT_ID.in(projectIds));
        var ordered = dslContext
                .select(
                        ISSUE.ISSUE_ID,
                        PROJECT_KEY.PREFIX,
                        ISSUE.NUMBER,
                        ISSUE.TITLE,
                        ISSUE.CREATED_AT,
                        ISSUE.UPDATED_AT,
                        ISSUE.DELETED_AT)
                .from(ISSUE)
                .join(PROJECT)
                .on(PROJECT.PROJECT_ID.eq(ISSUE.PROJECT_ID))
                .join(PROJECT_KEY)
                .on(PROJECT_KEY.PROJECT_ID.eq(ISSUE.PROJECT_ID).and(PROJECT_KEY.IS_CURRENT.isTrue()))
                .where(condition)
                .orderBy(List.of(ISSUE.UPDATED_AT.desc(), ISSUE.ISSUE_ID.desc()));
        var fetched = cursor == null
                ? ordered.limit(size + 1).fetch()
                : ordered.seek(Keyset.after(cursor, "issue-changes", keys))
                        .limit(size + 1)
                        .fetch();
        var shown = fetched.size() > size ? fetched.subList(0, size) : fetched;
        return new ChangeSlice(
                shown.stream()
                        .map(row -> new Change(
                                row.get(ISSUE.ISSUE_ID),
                                row.get(PROJECT_KEY.PREFIX),
                                row.get(ISSUE.NUMBER),
                                row.get(ISSUE.TITLE),
                                row.get(ISSUE.CREATED_AT),
                                row.get(ISSUE.UPDATED_AT),
                                row.get(ISSUE.DELETED_AT)))
                        .toList(),
                fetched.size() > size ? Keyset.next("issue-changes", shown.getLast(), keys) : null);
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
        return new Slice(rows(shown), next);
    }

    @Override
    public List<IssueViews.IssueGroup> groups(Filter filter, IssueRequests.Grouping grouping, boolean workspace) {
        var count = DSL.count();
        if (grouping == IssueRequests.Grouping.STATUS) {
            // 카드 본문·라벨·하위 건수는 읽지 않고 상태별 집계만 수행한다.
            var found = dslContext
                    .select(ISSUE_COLUMN.COLUMN_ID, ISSUE_COLUMN.NAME, ISSUE_COLUMN.CATEGORY, count)
                    .from(ISSUE)
                    .join(ISSUE_COLUMN)
                    .on(ISSUE_COLUMN.COLUMN_ID.eq(ISSUE.COLUMN_ID))
                    .join(PROJECT)
                    .on(PROJECT.PROJECT_ID.eq(ISSUE.PROJECT_ID))
                    .where(conditions(filter))
                    .groupBy(ISSUE_COLUMN.COLUMN_ID, ISSUE_COLUMN.NAME, ISSUE_COLUMN.CATEGORY, ISSUE_COLUMN.POSITION)
                    .orderBy(ISSUE_COLUMN.POSITION, ISSUE_COLUMN.NAME)
                    .fetch();
            var groups = new java.util.LinkedHashMap<String, IssueViews.IssueGroup>();
            for (var row : found) {
                var category = ColumnCategory.valueOf(row.get(ISSUE_COLUMN.CATEGORY));
                String name = row.get(ISSUE_COLUMN.NAME);
                String id = workspace
                        ? category.name() + ":" + name
                        : row.get(ISSUE_COLUMN.COLUMN_ID).toString();
                var previous = groups.get(id);
                var ids = new ArrayList<UUID>();
                if (previous != null) ids.addAll(previous.columnIds());
                ids.add(row.get(ISSUE_COLUMN.COLUMN_ID));
                groups.put(
                        id,
                        new IssueViews.IssueGroup(
                                id,
                                name,
                                category,
                                row.get(count).longValue() + (previous == null ? 0 : previous.total()),
                                ids));
            }
            return List.copyOf(groups.values());
        }
        Field<String> key =
                switch (grouping) {
                    case ASSIGNEE -> DSL.coalesce(ISSUE.ASSIGNEE_ID.cast(String.class), DSL.inline("none"));
                    case PRIORITY -> ISSUE.PRIORITY;
                    case TYPE -> ISSUE.TYPE;
                    case PROJECT -> PROJECT_KEY.PREFIX;
                    default -> DSL.inline("all");
                };
        Field<String> name = grouping == IssueRequests.Grouping.PROJECT ? PROJECT.NAME : key;
        return dslContext
                .select(key, name, count)
                .from(ISSUE)
                .join(ISSUE_COLUMN)
                .on(ISSUE_COLUMN.COLUMN_ID.eq(ISSUE.COLUMN_ID))
                .join(PROJECT)
                .on(PROJECT.PROJECT_ID.eq(ISSUE.PROJECT_ID))
                .join(PROJECT_KEY)
                .on(PROJECT_KEY.PROJECT_ID.eq(ISSUE.PROJECT_ID).and(PROJECT_KEY.IS_CURRENT.isTrue()))
                .where(conditions(filter))
                .groupBy(key, name)
                .orderBy(name)
                .fetch(row -> new IssueViews.IssueGroup(
                        row.get(key), row.get(name), null, row.get(count).longValue(), List.of()));
    }

    @Override
    public Optional<IssueViews.IssueRow> findRow(UUID issueId) {
        var found = select().where(live().and(ISSUE.ISSUE_ID.eq(issueId))).fetch();
        return rows(found).stream().findFirst();
    }

    @Override
    public List<IssueViews.IssueRow> findChildren(UUID issueId) {
        var found = select().where(live().and(ISSUE.PARENT_ID.eq(issueId)))
                .orderBy(ISSUE_COLUMN.POSITION, ISSUE.POSITION, ISSUE.ISSUE_ID)
                .fetch();
        return rows(found);
    }

    @Override
    public Optional<UUID> findCreatorId(UUID issueId) {
        return dslContext
                .select(ISSUE.CREATED_BY)
                .from(ISSUE)
                .where(ISSUE.ISSUE_ID.eq(issueId))
                .fetchOptional(ISSUE.CREATED_BY);
    }

    private SelectOnConditionStep<Record> select() {
        var children = DSL.selectCount()
                .from(CHILD)
                .where(CHILD.PARENT_ID.eq(ISSUE.ISSUE_ID).and(CHILD.DELETED_AT.isNull()))
                .asField("child_count");
        var spent = DSL.select(DSL.coalesce(DSL.sum(ISSUE_TIME_ENTRY.MINUTES), java.math.BigDecimal.ZERO))
                .from(ISSUE_TIME_ENTRY)
                .where(ISSUE_TIME_ENTRY.ISSUE_ID.eq(ISSUE.ISSUE_ID))
                .asField("spent_minutes");
        var cycleName = DSL.select(ISSUE_CYCLE.NAME)
                .from(ISSUE_CYCLE)
                .where(ISSUE_CYCLE.CYCLE_ID.eq(ISSUE.CYCLE_ID))
                .asField("cycle_name");
        return dslContext
                .select(ISSUE.fields())
                .select(
                        ISSUE_COLUMN.NAME,
                        ISSUE_COLUMN.CATEGORY,
                        ISSUE_COLUMN.POSITION,
                        PROJECT.NAME,
                        PROJECT.POSITION,
                        PROJECT_KEY.PREFIX,
                        spent,
                        cycleName,
                        children)
                .from(ISSUE)
                .join(ISSUE_COLUMN)
                .on(ISSUE_COLUMN.COLUMN_ID.eq(ISSUE.COLUMN_ID))
                .join(PROJECT)
                .on(PROJECT.PROJECT_ID.eq(ISSUE.PROJECT_ID))
                .join(PROJECT_KEY)
                .on(PROJECT_KEY.PROJECT_ID.eq(ISSUE.PROJECT_ID).and(PROJECT_KEY.IS_CURRENT.isTrue()));
    }

    private static Condition live() {
        return ISSUE.DELETED_AT.isNull().and(PROJECT.DELETED_AT.isNull());
    }

    private static Condition conditions(Filter filter) {
        var condition = live();
        if (!filter.projectIds().isEmpty()) condition = condition.and(ISSUE.PROJECT_ID.in(filter.projectIds()));
        if (!filter.columnIds().isEmpty()) condition = condition.and(ISSUE.COLUMN_ID.in(filter.columnIds()));
        if (!filter.categories().isEmpty())
            condition = condition.and(ISSUE_COLUMN.CATEGORY.in(
                    filter.categories().stream().map(ColumnCategory::name).toList()));
        if (!filter.assigneeIds().isEmpty() || filter.unassigned()) {
            Condition assignee = DSL.falseCondition();
            if (!filter.assigneeIds().isEmpty()) assignee = assignee.or(ISSUE.ASSIGNEE_ID.in(filter.assigneeIds()));
            if (filter.unassigned()) assignee = assignee.or(ISSUE.ASSIGNEE_ID.isNull());
            condition = condition.and(assignee);
        }
        if (!filter.labelIds().isEmpty())
            condition = condition.and(DSL.exists(DSL.selectOne()
                    .from(ISSUE_LABEL_LINK)
                    .where(ISSUE_LABEL_LINK.ISSUE_ID.eq(ISSUE.ISSUE_ID))
                    .and(ISSUE_LABEL_LINK.LABEL_ID.in(filter.labelIds()))));
        if (!filter.types().isEmpty()) condition = condition.and(ISSUE.TYPE.in(filter.types()));
        if (!filter.priorities().isEmpty())
            condition = condition.and(ISSUE.PRIORITY.in(
                    filter.priorities().stream().map(IssuePriority::name).toList()));
        if (!filter.cycleIds().isEmpty() || filter.noCycle()) {
            Condition cycle = DSL.falseCondition();
            if (!filter.cycleIds().isEmpty()) cycle = cycle.or(ISSUE.CYCLE_ID.in(filter.cycleIds()));
            if (filter.noCycle()) cycle = cycle.or(ISSUE.CYCLE_ID.isNull());
            condition = condition.and(cycle);
        }
        if (filter.parentId() != null) condition = condition.and(ISSUE.PARENT_ID.eq(filter.parentId()));
        if (filter.q() != null) condition = condition.and(text(filter.q()));
        return condition;
    }

    /** Part of the title; a number also finds that issue, and KEY-number the issue of that key, current or old. */
    private static Condition text(String q) {
        Condition title = ISSUE.TITLE.likeIgnoreCase("%" + escapeLike(q) + "%", '\\');
        var ref = REF.matcher(q);
        if (ref.matches())
            return title.or(ISSUE.NUMBER
                    .eq(Long.parseLong(ref.group(2)))
                    .and(DSL.exists(DSL.selectOne()
                            .from(PROJECT_KEY)
                            .where(PROJECT_KEY.PROJECT_ID.eq(ISSUE.PROJECT_ID))
                            .and(PROJECT_KEY.PREFIX.eq(ref.group(1).toUpperCase(Locale.ROOT))))));
        var number = NUMBER.matcher(q);
        if (number.matches()) return title.or(ISSUE.NUMBER.eq(Long.parseLong(number.group(1))));
        return title;
    }

    private static List<Field<?>> keys(IssueRequests.Sort sort) {
        return switch (sort) {
            case BOARD ->
                List.of(PROJECT.POSITION, ISSUE.PROJECT_ID, ISSUE_COLUMN.POSITION, ISSUE.POSITION, ISSUE.ISSUE_ID);
            case UPDATED -> List.of(ISSUE.UPDATED_AT, ISSUE.ISSUE_ID);
            case CREATED -> List.of(ISSUE.CREATED_AT, ISSUE.ISSUE_ID);
        };
    }

    private static List<SortField<?>> order(List<Field<?>> keys, SortDirection direction) {
        return keys.stream()
                .<SortField<?>>map(key -> direction == SortDirection.ASC ? key.asc() : key.desc())
                .toList();
    }

    private List<IssueViews.IssueRow> rows(List<? extends Record> found) {
        var labels = labelsOf(found.stream().map(row -> row.get(ISSUE.ISSUE_ID)).toList());
        var requests = pullRequestsOf(
                found.stream().map(row -> row.get(ISSUE.ISSUE_ID)).toList());
        var rows = new ArrayList<IssueViews.IssueRow>();
        for (var row : found) {
            String key = row.get(PROJECT_KEY.PREFIX);
            long number = row.get(ISSUE.NUMBER);
            rows.add(new IssueViews.IssueRow(
                    row.get(ISSUE.ISSUE_ID),
                    row.get(ISSUE.PROJECT_ID),
                    key,
                    row.get(PROJECT.NAME),
                    key + "-" + number,
                    number,
                    row.get(ISSUE.TITLE),
                    row.get(ISSUE.TYPE),
                    row.get(ISSUE.COLUMN_ID),
                    row.get(ISSUE_COLUMN.NAME),
                    ColumnCategory.valueOf(row.get(ISSUE_COLUMN.CATEGORY)),
                    row.get(ISSUE.POSITION),
                    IssuePriority.valueOf(row.get(ISSUE.PRIORITY)),
                    row.get(ISSUE.ASSIGNEE_ID),
                    null,
                    row.get(ISSUE.START_DATE),
                    row.get(ISSUE.DUE_DATE),
                    hours(row.get(ISSUE.ESTIMATE_MINUTES)),
                    row.get(ISSUE.STORY_POINTS),
                    hours(row.get("spent_minutes", Integer.class)),
                    row.get(ISSUE.CYCLE_ID),
                    row.get("cycle_name", String.class),
                    row.get(ISSUE.PARENT_ID),
                    labels.getOrDefault(row.get(ISSUE.ISSUE_ID), List.of()),
                    row.get("child_count", Integer.class),
                    row.get(ISSUE.STARTED_AT),
                    row.get(ISSUE.CLOSED_AT),
                    row.get(ISSUE.CREATED_AT),
                    row.get(ISSUE.UPDATED_AT),
                    row.get(ISSUE.VERSION),
                    requests.getOrDefault(row.get(ISSUE.ISSUE_ID), new IssueViews.PullRequests(0, 0, 0, 0))));
        }
        return rows;
    }

    private Map<UUID, IssueViews.PullRequests> pullRequestsOf(Collection<UUID> issueIds) {
        if (issueIds.isEmpty()) return Map.of();
        var grouped = dslContext
                .select(CODE_LINK.ISSUE_ID, CODE_LINK.STATE, DSL.count())
                .from(CODE_LINK)
                .where(CODE_LINK.ISSUE_ID.in(issueIds).and(CODE_LINK.KIND.eq("pull_request")))
                .groupBy(CODE_LINK.ISSUE_ID, CODE_LINK.STATE)
                .fetch();
        var counts = new java.util.HashMap<UUID, int[]>();
        for (var row : grouped) {
            var values = counts.computeIfAbsent(row.value1(), unused -> new int[4]);
            int slot =
                    switch (row.value2()) {
                        case "open" -> 0;
                        case "draft" -> 1;
                        case "merged" -> 2;
                        case "closed" -> 3;
                        default -> throw new IllegalStateException("알 수 없는 PR 상태");
                    };
            values[slot] = row.value3();
        }
        return counts.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> new IssueViews.PullRequests(
                                e.getValue()[0], e.getValue()[1], e.getValue()[2], e.getValue()[3])));
    }

    /** The labels on each issue of the page, in the project's label order, in one read. */
    private Map<UUID, List<IssueViews.LabelChip>> labelsOf(Collection<UUID> issueIds) {
        if (issueIds.isEmpty()) return Map.of();
        return dslContext
                .select(ISSUE_LABEL_LINK.ISSUE_ID, ISSUE_LABEL.LABEL_ID, ISSUE_LABEL.NAME, ISSUE_LABEL.COLOR)
                .from(ISSUE_LABEL_LINK)
                .join(ISSUE_LABEL)
                .on(ISSUE_LABEL.LABEL_ID.eq(ISSUE_LABEL_LINK.LABEL_ID))
                .where(ISSUE_LABEL_LINK.ISSUE_ID.in(issueIds))
                .orderBy(ISSUE_LABEL.POSITION, ISSUE_LABEL.LABEL_ID)
                .fetch()
                .stream()
                .collect(Collectors.groupingBy(
                        row -> row.get(ISSUE_LABEL_LINK.ISSUE_ID),
                        Collectors.mapping(
                                row -> new IssueViews.LabelChip(
                                        row.get(ISSUE_LABEL.LABEL_ID),
                                        row.get(ISSUE_LABEL.NAME),
                                        row.get(ISSUE_LABEL.COLOR)),
                                Collectors.toList())));
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    /** Minutes as hours, to two places. */
    private static Double hours(Integer minutes) {
        return minutes == null ? null : Math.round(minutes / 60.0 * 100) / 100.0;
    }
}

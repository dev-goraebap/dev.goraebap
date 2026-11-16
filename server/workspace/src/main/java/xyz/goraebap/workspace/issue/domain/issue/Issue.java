package xyz.goraebap.workspace.issue.domain.issue;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.workspace.issue.domain.board.ColumnCategory;
import xyz.goraebap.foundation.shared.error.DomainRuleViolation;

/**
 * An issue of a project, as BIT's work item: its number in the project (KEY-number), what it says (Details), the board
 * column it sits in and its place there (a fraction between its neighbours'), when it was first under way and when its
 * column closed it. A deleted
 * issue is kept for its number and history. Its body is kept apart, so typing in it never conflicts with its properties.
 */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Issue {
    public static final int TITLE_MAX = 200;
    public static final int LABELS_MAX = 20;
    /** The most an estimate may be: 1000 hours. */
    public static final int ESTIMATE_MAX_MINUTES = 60_000;
    /** The story points a work item may have (planning poker's; 5 and up is worth splitting). */
    public static final java.util.List<Double> STORY_POINTS = java.util.List.of(0.5, 1.0, 2.0, 3.0, 5.0, 8.0, 13.0);

    @EqualsAndHashCode.Include
    private final UUID id;

    private final UUID projectId;
    private final long number;
    private Details details;
    private UUID columnId;
    private double position;
    private Instant startedAt;
    private Instant closedAt;
    private Instant deletedAt;
    private final long version;

    /** The type a work item keeps when none reached it (the service gives the workspace's default first). */
    public static final String DEFAULT_TYPE = "TASK";

    /**
     * What an issue says: its title, type (a work item type's code), priority, assignee, dates (both days included), parent
     * issue and labels, and the planned effort: an estimate in minutes and story points.
     */
    public record Details(
            String title,
            String type,
            IssuePriority priority,
            UUID assigneeId,
            LocalDate startDate,
            LocalDate dueDate,
            UUID parentId,
            Set<UUID> labelIds,
            Integer estimateMinutes,
            Double storyPoints,
            UUID cycleId) {
        public Details {
            labelIds = labelIds == null ? Set.of() : Set.copyOf(labelIds);
        }

        /**
         * The details checked: a title of 1–200 letters (trimmed), a type, dates in order, at most 20 labels, an estimate
         * of a minute to 1000 hours and story points from the scale.
         */
        public static Details of(
                String title,
                String type,
                IssuePriority priority,
                UUID assigneeId,
                LocalDate startDate,
                LocalDate dueDate,
                UUID parentId,
                Set<UUID> labelIds,
                Integer estimateMinutes,
                Double storyPoints,
                UUID cycleId) {
            String trimmed = title == null ? "" : title.strip();
            if (trimmed.isEmpty() || trimmed.length() > TITLE_MAX) throw new DomainRuleViolation("제목은 1~200자입니다");
            if (startDate != null && dueDate != null && startDate.isAfter(dueDate))
                throw new DomainRuleViolation("시작일이 마감일보다 늦습니다");
            if (labelIds != null && labelIds.size() > LABELS_MAX) throw new DomainRuleViolation("라벨은 20개까지입니다");
            if (estimateMinutes != null && (estimateMinutes < 1 || estimateMinutes > ESTIMATE_MAX_MINUTES))
                throw new DomainRuleViolation("추정시간은 1분에서 1000시간 사이입니다");
            if (storyPoints != null && !STORY_POINTS.contains(storyPoints))
                throw new DomainRuleViolation("스토리 포인트는 0.5, 1, 2, 3, 5, 8, 13 중 하나입니다");
            return new Details(
                    trimmed,
                    type == null || type.isBlank() ? DEFAULT_TYPE : type,
                    priority == null ? IssuePriority.NONE : priority,
                    assigneeId,
                    startDate,
                    dueDate,
                    parentId,
                    labelIds,
                    estimateMinutes,
                    storyPoints,
                    cycleId);
        }
    }

    /** A new issue in the given column at the given place; a closing column closes it from the start. */
    public static Issue create(
            UUID id,
            UUID projectId,
            long number,
            Details details,
            UUID columnId,
            boolean columnCloses,
            double position,
            Instant now) {
        if (details == null) throw new DomainRuleViolation("이슈 내용이 없습니다");
        if (id.equals(details.parentId())) throw new DomainRuleViolation("이슈를 자신의 하위로 둘 수 없습니다");
        return new Issue(id, projectId, number, details, columnId, position, null, columnCloses ? now : null, null, 0);
    }

    /**
     * What a status says about the work, written down when the issue gets there so nobody has to remember to (2026-11-11):
     * first under way, the moment is kept, an issue nobody holds goes to who moved it and one with no start date starts
     * today; done, an issue nobody holds goes to who finished it and one with no due date was due today. Only what is
     * empty is filled, so a plan somebody wrote stays, and a date filled never crosses the other one. Nobody moving it
     * (a repository's rule) leaves the assignee alone.
     */
    public void settle(ColumnCategory category, UUID actor, LocalDate today, Instant now) {
        boolean starts = category == ColumnCategory.STARTED && startedAt == null;
        boolean completes = category == ColumnCategory.COMPLETED;
        if (starts) startedAt = now;
        if (!starts && !completes) return;
        UUID assignee = details.assigneeId() == null ? actor : details.assigneeId();
        LocalDate start = details.startDate();
        LocalDate due = details.dueDate();
        if (starts && start == null) start = due != null && due.isBefore(today) ? due : today;
        if (completes && due == null) due = start != null && start.isAfter(today) ? start : today;
        details = new Details(
                details.title(),
                details.type(),
                details.priority(),
                assignee,
                start,
                due,
                details.parentId(),
                details.labelIds(),
                details.estimateMinutes(),
                details.storyPoints(),
                details.cycleId());
    }

    /** Puts the issue in another cycle, or none (a cycle finished passes what is left on). */
    public void moveToCycle(UUID cycleId) {
        details = new Details(
                details.title(),
                details.type(),
                details.priority(),
                details.assigneeId(),
                details.startDate(),
                details.dueDate(),
                details.parentId(),
                details.labelIds(),
                details.estimateMinutes(),
                details.storyPoints(),
                cycleId);
    }

    public static Issue fromPersistence(
            UUID id,
            UUID projectId,
            long number,
            Details details,
            UUID columnId,
            double position,
            Instant startedAt,
            Instant closedAt,
            Instant deletedAt,
            long version) {
        return new Issue(id, projectId, number, details, columnId, position, startedAt, closedAt, deletedAt, version);
    }

    public void revise(Details next) {
        if (next == null) throw new DomainRuleViolation("이슈 내용이 없습니다");
        if (id.equals(next.parentId())) throw new DomainRuleViolation("이슈를 자신의 하위로 둘 수 없습니다");
        this.details = next;
    }

    /**
     * Puts the issue in a column at a place; entering a closing column closes it, leaving one opens it again. Getting
     * under way or done fills what the status says (settle); an issue already done is not filled again.
     */
    public void moveTo(
            UUID columnId, ColumnCategory category, double position, UUID actor, LocalDate today, Instant now) {
        boolean columnCloses = category.closes();
        if (closedAt == null || category != ColumnCategory.COMPLETED) settle(category, actor, today, now);
        if (columnCloses && closedAt == null) closedAt = now;
        if (!columnCloses) closedAt = null;
        this.columnId = columnId;
        this.position = position;
    }

    public void delete(Instant now) {
        if (deletedAt == null) deletedAt = now;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }
}

package xyz.goraebap.cowork.module.workspace.issue.application.issue;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import xyz.goraebap.cowork.module.workspace.issue.domain.board.ColumnCategory;
import xyz.goraebap.cowork.module.workspace.issue.domain.issue.IssueActivity;
import xyz.goraebap.cowork.module.workspace.issue.domain.issue.IssuePriority;

public final class IssueViews {
    private IssueViews() {}

    /** A label on an issue, as its chip shows it. */
    public record LabelChip(UUID id, String name, String color) {}

    /**
     * An issue as lists and the board show it: its project (current key and name), its reference (KEY-number), status
     * (column and category), place in the column, properties, how many live children it has, and its version.
     */
    public record PullRequests(int open, int draft, int merged, int closed) {}

    public record IssueRow(
            UUID id,
            UUID projectId,
            String projectKey,
            String projectName,
            String ref,
            long number,
            String title,
            String type,
            UUID columnId,
            String columnName,
            ColumnCategory category,
            double position,
            IssuePriority priority,
            UUID assigneeId,
            String assigneeName,
            LocalDate startDate,
            LocalDate dueDate,
            Double estimateHours,
            Double storyPoints,
            double spentHours,
            UUID cycleId,
            String cycleName,
            UUID parentId,
            List<LabelChip> labels,
            int childCount,
            Instant startedAt,
            Instant closedAt,
            Instant createdAt,
            Instant updatedAt,
            long version,
            PullRequests pullRequests) {
        public IssueRow {
            labels = List.copyOf(labels);
        }

        /** The same row with its assignee's name, read after the page was chosen. */
        public IssueRow named(String name) {
            return new IssueRow(
                    id,
                    projectId,
                    projectKey,
                    projectName,
                    ref,
                    number,
                    title,
                    type,
                    columnId,
                    columnName,
                    category,
                    position,
                    priority,
                    assigneeId,
                    name,
                    startDate,
                    dueDate,
                    estimateHours,
                    storyPoints,
                    spentHours,
                    cycleId,
                    cycleName,
                    parentId,
                    labels,
                    childCount,
                    startedAt,
                    closedAt,
                    createdAt,
                    updatedAt,
                    version,
                    pullRequests);
        }
    }

    /** 칼럼의 전체 일치 건수. 상태 그룹의 columnIds는 해당 칼럼만 읽는 목록 조건이다. */
    public record IssueGroup(String id, String name, ColumnCategory category, long total, List<UUID> columnIds) {
        public IssueGroup {
            columnIds = List.copyOf(columnIds);
        }
    }

    /** One slice of a list, and the cursor for the next when there is one. */
    public record IssueSlice(List<IssueRow> items, String nextCursor) {
        public IssueSlice {
            items = List.copyOf(items);
        }
    }

    /** Another issue named from one: its reference, title and status category. */
    public record IssueRef(UUID id, String ref, long number, String title, ColumnCategory category) {}

    /**
     * An issue opened: its row, its parent and live children, who made it, and whether the reader may change it (the
     * project is not archived).
     */
    public record IssueView(
            IssueRow issue,
            IssueRef parent,
            List<IssueRow> children,
            UUID createdById,
            String createdByName,
            boolean canWrite) {
        public IssueView {
            children = List.copyOf(children);
        }
    }

    /** What an issue's timeline shows, oldest first: a comment or something that happened. */
    public enum TimelineKind {
        COMMENT,
        ACTIVITY
    }

    /**
     * One entry of an issue's timeline, by whom and when. A comment carries its text, the words of the body it quotes
     * (written on a passage of the body), the comment it replies to and when it was edited; an activity the field and its values before and after
     * as the timeline shows them (a person by name).
     */
    public record TimelineEntry(
            TimelineKind kind,
            UUID id,
            Instant at,
            UUID actorId,
            String actorName,
            String body,
            String quote,
            UUID parentId,
            Instant editedAt,
            IssueActivity.Field field,
            String before,
            String after,
            xyz.goraebap.cowork.shared.web.AgentActor agent,
            /** The block of the body a thread's first comment sits on (a reply follows its thread). */
            String blockId,
            /** When the thread a first comment starts was resolved, and by whom (null while it is open). */
            Instant resolvedAt,
            String resolvedByName) {}
}

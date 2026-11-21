package xyz.goraebap.cowork.module.workspace.issue.application.issue;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import xyz.goraebap.cowork.module.workspace.issue.domain.board.ColumnCategory;
import xyz.goraebap.cowork.module.workspace.issue.domain.issue.Issue;
import xyz.goraebap.cowork.module.workspace.issue.domain.issue.IssuePriority;
import xyz.goraebap.cowork.shared.web.ListParams;
import xyz.goraebap.cowork.shared.web.SortDirection;

public final class IssueRequests {
    private IssueRequests() {}

    /**
     * How a list of issues runs: BOARD by project, then column and place in it (a project's list and board, ascending
     * only); UPDATED and CREATED by that moment, newest first unless direction says otherwise.
     */
    @io.swagger.v3.oas.annotations.media.Schema(name = "IssueGrouping")
    public enum Grouping {
        STATUS,
        ASSIGNEE,
        PRIORITY,
        TYPE,
        PROJECT,
        NONE
    }

    public enum Sort {
        BOARD,
        UPDATED,
        CREATED
    }

    /**
     * A search over issues. project names projects by key (the area's list only; a project's list is its own); columnId
     * and category the status; assignee takes member ids, me for the reader and none for no assignee; labelId, type and
     * priority narrow further, any of each matching; cycle takes cycle ids, current for each project's cycle under way and
     * none for no cycle. q matches part of the title, a number or a KEY-number. parentId
     * keeps the children of one issue. cursor continues after the last slice read.
     */
    public record Listing(
            List<String> project,
            List<UUID> columnId,
            List<ColumnCategory> category,
            List<String> assignee,
            List<UUID> labelId,
            List<@Size(max = 16) String> type,
            List<IssuePriority> priority,
            List<@Size(max = 40) String> cycle,
            @Size(max = Q_MAX) String q,
            UUID parentId,
            Sort sort,
            SortDirection direction,
            @Size(max = 1000) String cursor,
            @Min(1) @Max(MAX_SIZE) Integer size) {
        public static final int Q_MAX = 100;
        public static final int DEFAULT_SIZE = 50;
        public static final int MAX_SIZE = 200;

        public Listing {
            project = List.copyOf(ListParams.strings(project));
            columnId = List.copyOf(ListParams.values(columnId));
            category = List.copyOf(ListParams.values(category));
            assignee = List.copyOf(ListParams.strings(assignee));
            labelId = List.copyOf(ListParams.values(labelId));
            type = List.copyOf(ListParams.values(type));
            priority = List.copyOf(ListParams.values(priority));
            cycle = List.copyOf(ListParams.strings(cycle));
            q = q == null || q.isBlank() ? null : q.strip();
            cursor = cursor == null || cursor.isBlank() ? null : cursor;
            size = Objects.requireNonNullElse(size, DEFAULT_SIZE);
        }
    }

    /** A new issue in the project: the column it starts in (the first not-started one when none), and its details. */
    public record CreateIssue(
            @NotBlank @Size(max = Issue.TITLE_MAX) String title,
            @Size(max = 16) String type,
            UUID columnId,
            IssuePriority priority,
            UUID assigneeId,
            LocalDate startDate,
            LocalDate dueDate,
            UUID parentId,
            @Size(max = Issue.LABELS_MAX) Set<@NotNull UUID> labelIds,
            Double estimateHours,
            Double storyPoints,
            UUID cycleId) {
        public CreateIssue {
            labelIds = labelIds == null ? Set.of() : Set.copyOf(labelIds);
        }
    }

    /**
     * Everything the properties show at once, over the version they were read at: an absent value clears it (no
     * assignee, no dates, no parent, no labels, no estimate, no story points).
     */
    public record EditIssue(
            @NotNull Long expectedVersion,
            @NotBlank @Size(max = Issue.TITLE_MAX) String title,
            @NotBlank @Size(max = 16) String type,
            @NotNull UUID columnId,
            @NotNull IssuePriority priority,
            UUID assigneeId,
            LocalDate startDate,
            LocalDate dueDate,
            UUID parentId,
            @Size(max = Issue.LABELS_MAX) Set<@NotNull UUID> labelIds,
            Double estimateHours,
            Double storyPoints,
            UUID cycleId) {
        public EditIssue {
            labelIds = labelIds == null ? Set.of() : Set.copyOf(labelIds);
        }
    }

    /** Puts an issue in a column right after another issue there, or first when afterId is absent. */
    public record Move(@NotNull UUID columnId, UUID afterId) {}
}

package xyz.goraebap.module.workspace.issue.application.issue;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import xyz.goraebap.module.workspace.issue.domain.board.ColumnCategory;
import xyz.goraebap.module.workspace.issue.domain.issue.IssuePriority;
import xyz.goraebap.shared.web.SortDirection;

/** Issues as the screens read them; deleted issues and those of deleted projects are never shown. */
public interface IssueQuery {
    record Change(
            UUID id,
            String projectKey,
            long number,
            String title,
            Instant createdAt,
            Instant updatedAt,
            Instant deletedAt) {}

    record ChangeSlice(List<Change> rows, String nextCursor) {
        public ChangeSlice {
            rows = List.copyOf(rows);
        }
    }

    ChangeSlice changes(List<UUID> projectIds, Instant since, Instant until, String cursor, int size);

    /** A slice of the issues matching the filter, in its order; rows carry no assignee name. */
    Slice findAll(Filter filter, String cursor, int size);

    List<IssueViews.IssueGroup> groups(Filter filter, IssueRequests.Grouping grouping, boolean workspace);

    /** One live issue's row, without the assignee's name. */
    Optional<IssueViews.IssueRow> findRow(UUID issueId);

    /** The issue's live children, in board order, without names. */
    List<IssueViews.IssueRow> findChildren(UUID issueId);

    /** Who made the issue. */
    Optional<UUID> findCreatorId(UUID issueId);

    /**
     * What to list: projectIds (empty, every live project), the statuses by column or category, assigneeIds or none
     * (unassigned), labels, types and priorities (any of each), text, the children of one issue, and the order.
     */
    record Filter(
            List<UUID> projectIds,
            List<UUID> columnIds,
            List<ColumnCategory> categories,
            List<UUID> assigneeIds,
            boolean unassigned,
            List<UUID> labelIds,
            List<String> types,
            List<IssuePriority> priorities,
            List<UUID> cycleIds,
            boolean noCycle,
            String q,
            UUID parentId,
            IssueRequests.Sort sort,
            SortDirection direction) {
        public Filter {
            projectIds = List.copyOf(projectIds);
            columnIds = List.copyOf(columnIds);
            categories = List.copyOf(categories);
            assigneeIds = List.copyOf(assigneeIds);
            labelIds = List.copyOf(labelIds);
            types = List.copyOf(types);
            priorities = List.copyOf(priorities);
            cycleIds = List.copyOf(cycleIds);
        }
    }

    record Slice(List<IssueViews.IssueRow> rows, String nextCursor) {
        public Slice {
            rows = List.copyOf(rows);
        }
    }
}

package xyz.goraebap.module.workspace.issue.application.view;

import jakarta.validation.constraints.Size;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import xyz.goraebap.module.workspace.issue.domain.view.SavedView;

public final class SavedViewViews {
    private SavedViewViews() {}

    /**
     * A view's filters as an issue list's address names them, several values of one joined by commas: project keys
     * (the area's only), status (a project's column ids, across the area the categories), assignee (member ids, me and
     * none), label ids, types and priorities.
     */
    public record ViewFilters(
            @Size(max = SavedView.FILTER_VALUE_MAX) String project,
            @Size(max = SavedView.FILTER_VALUE_MAX) String status,
            @Size(max = SavedView.FILTER_VALUE_MAX) String assignee,
            @Size(max = SavedView.FILTER_VALUE_MAX) String label,
            @Size(max = SavedView.FILTER_VALUE_MAX) String type,
            @Size(max = SavedView.FILTER_VALUE_MAX) String priority) {
        public static final ViewFilters NONE = new ViewFilters(null, null, null, null, null, null);

        static ViewFilters of(Map<String, String> filters) {
            return new ViewFilters(
                    filters.get("project"),
                    filters.get("status"),
                    filters.get("assignee"),
                    filters.get("label"),
                    filters.get("type"),
                    filters.get("priority"));
        }

        Map<String, String> toMap() {
            var map = new HashMap<String, String>();
            map.put("project", project);
            map.put("status", status);
            map.put("assignee", assignee);
            map.put("label", label);
            map.put("type", type);
            map.put("priority", priority);
            return map;
        }
    }

    /** A view as the pills show it, with whether the reader may change it. */
    public record ViewRow(
            UUID id,
            String name,
            String icon,
            String color,
            SavedView.Layout layout,
            ViewFilters filters,
            SavedView.SortKey sort,
            SavedView.Direction direction,
            SavedView.Grouping grouping,
            boolean isPersonal,
            boolean canEdit,
            long version) {}

    /**
     * A scope's views as the reader sees them: order holds every key in the pills' order, 전체 이슈 as 'all' among the
     * shared views and the reader's personal views after them, the first the scope's default. canOrder tells whether
     * the reader may change the shared views' order (and so make or keep shared views).
     */
    public record ViewList(List<String> order, List<ViewRow> views, boolean canOrder) {
        public ViewList {
            order = List.copyOf(order);
            views = List.copyOf(views);
        }
    }
}

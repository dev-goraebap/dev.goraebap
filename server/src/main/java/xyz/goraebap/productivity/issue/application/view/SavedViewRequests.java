package xyz.goraebap.productivity.issue.application.view;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import xyz.goraebap.productivity.issue.domain.view.SavedView;

public final class SavedViewRequests {
    private SavedViewRequests() {}

    /**
     * A view as made or changed at once: its name and mark, layout, filters as the list's address names them, order and
     * grouping, and whether only its maker sees it. A view shared with everyone is a Workspace administrator's to keep.
     */
    public record ViewInput(
            @NotBlank @Size(max = SavedView.NAME_MAX) String name,
            @NotBlank @Size(max = SavedView.ICON_MAX) String icon,

            @NotBlank @Pattern(regexp = SavedView.COLOR_PATTERN) String color,

            @NotNull SavedView.Layout layout,
            @Valid SavedViewViews.ViewFilters filters,
            @NotNull SavedView.SortKey sort,
            @NotNull SavedView.Direction direction,
            @NotNull SavedView.Grouping grouping,
            boolean isPersonal) {
        public ViewInput {
            filters = filters == null ? SavedViewViews.ViewFilters.NONE : filters;
        }
    }

    /** A change to a view over the version it was read at. */
    public record EditView(
            @NotNull Long expectedVersion, @NotNull @Valid ViewInput view) {}

    /** A scope's shared views in a new order, 전체 이슈 as 'all' among them; the first is the scope's default. */
    @Schema(name = "SavedViewOrder")
    public record Order(@NotNull @Size(max = 200) List<@NotBlank @Size(max = 40) String> keys) {
        public Order {
            keys = keys == null ? List.of() : List.copyOf(keys);
        }
    }
}

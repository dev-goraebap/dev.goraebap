package xyz.goraebap.module.workspace.document.application.library;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import xyz.goraebap.module.workspace.document.domain.library.LibraryState.Label;
import xyz.goraebap.module.workspace.document.domain.library.LibraryState.Layout;
import xyz.goraebap.module.workspace.document.domain.library.LibraryState.Order;
import xyz.goraebap.module.workspace.document.domain.library.LibraryState.Sort;
import xyz.goraebap.module.workspace.document.domain.library.LibraryState.View;

public final class LibraryModels {
    private LibraryModels() {}

    public record Library(
            List<Label> labels,
            Map<UUID, List<UUID>> assignments,
            List<View> views,
            List<xyz.goraebap.module.workspace.document.application.document.DocumentViews.DocumentRow> pages,
            Order order,
            boolean canManage) {
        public Library {
            labels = List.copyOf(labels);
            views = List.copyOf(views);
            pages = List.copyOf(pages);
            assignments = Map.copyOf(assignments.entrySet().stream()
                    .collect(java.util.stream.Collectors.toMap(Map.Entry::getKey, e -> List.copyOf(e.getValue()))));
        }
    }

    public record Labels(
            @NotNull Long expectedVersion, @NotNull List<UUID> ids) {
        public Labels {
            ids = ids == null ? null : List.copyOf(ids);
        }
    }

    public record SaveView(
            Long expectedVersion,
            @NotBlank @Size(max = 200) String name,
            @NotNull List<UUID> labels,
            @Size(max = 64) String icon,

            @jakarta.validation.constraints.Pattern(regexp = "#[0-9a-fA-F]{6}") String color,

            @NotNull Layout layout,
            @NotNull Sort sort,

            @jakarta.validation.constraints.Pattern(regexp = "ASC|DESC") String direction) {
        public SaveView {
            direction = direction == null ? "ASC" : direction;
            labels = labels == null ? null : List.copyOf(labels);
        }
    }

    public record MovePage(@NotNull Long expectedVersion, UUID parentId) {}

    public record ViewOrder(@NotNull List<UUID> ids) {
        public ViewOrder {
            ids = ids == null ? null : List.copyOf(ids);
        }
    }

    public record SaveOrder(
            @NotNull Long expectedVersion, @NotNull List<UUID> ids, UUID parentId) {
        public SaveOrder {
            ids = ids == null ? null : List.copyOf(ids);
        }
    }
}

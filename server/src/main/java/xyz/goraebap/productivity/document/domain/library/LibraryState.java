package xyz.goraebap.productivity.document.domain.library;

import java.util.List;
import java.util.UUID;

public final class LibraryState {
    private LibraryState() {}

    public enum Layout {
        LIST,
        GRID
    }

    public enum Sort {
        CUSTOM,
        TITLE,
        UPDATED,
        CREATED
    }

    public record Label(UUID id, String name, String color, int position, long version, int uses) {}

    public record View(
            UUID id,
            String name,
            List<UUID> labels,
            String icon,
            String color,
            Layout layout,
            Sort sort,
            String direction,
            long version) {
        public View {
            labels = List.copyOf(labels);
        }
    }

    public record Order(List<UUID> ids, long version) {
        public Order {
            ids = List.copyOf(ids);
        }
    }
}

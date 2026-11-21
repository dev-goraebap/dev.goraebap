package xyz.goraebap.productivity.document.domain.library;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import xyz.goraebap.productivity.document.domain.library.LibraryState.Label;
import xyz.goraebap.productivity.document.domain.library.LibraryState.Order;
import xyz.goraebap.productivity.document.domain.library.LibraryState.View;

public interface LibraryRepository {
    List<Label> labels();

    Map<UUID, List<UUID>> assignments(UUID project);

    List<View> views(UUID project);

    Order order(UUID project);

    UUID addLabel(String name);

    boolean saveLabel(UUID id, String name, String color, Long expectedVersion);

    boolean deleteLabel(UUID id, long expectedVersion);

    void orderLabels(List<UUID> ids);

    void assign(UUID document, List<UUID> labels);

    boolean saveView(UUID project, UUID id, View value, Long expectedVersion);

    boolean deleteView(UUID project, UUID id, long version);

    /** Puts a project's views in the given order (every one of them). */
    void orderViews(UUID project, List<UUID> ids);

    boolean order(UUID project, Order value);
}

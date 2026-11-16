package xyz.goraebap.workspace.document.infrastructure;

import org.springframework.beans.factory.annotation.Qualifier;
import xyz.goraebap.workspace.WorkspaceDatabaseConfig;
import static xyz.goraebap.workspace.jooq.tables.DocumentLabel.DOCUMENT_LABEL;
import static xyz.goraebap.workspace.jooq.tables.DocumentLabelLink.DOCUMENT_LABEL_LINK;
import static xyz.goraebap.workspace.jooq.tables.DocumentLibraryOrder.DOCUMENT_LIBRARY_ORDER;
import static xyz.goraebap.workspace.jooq.tables.DocumentView.DOCUMENT_VIEW;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.workspace.document.domain.library.LibraryRepository;
import xyz.goraebap.workspace.document.domain.library.LibraryState.Label;
import xyz.goraebap.workspace.document.domain.library.LibraryState.Layout;
import xyz.goraebap.workspace.document.domain.library.LibraryState.Order;
import xyz.goraebap.workspace.document.domain.library.LibraryState.Sort;
import xyz.goraebap.workspace.document.domain.library.LibraryState.View;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

@Repository
@RequiredArgsConstructor
class JooqLibraryRepository implements LibraryRepository {
    private static final TypeReference<List<UUID>> IDS = new TypeReference<>() {};
    @Qualifier(WorkspaceDatabaseConfig.DSL)
    private final DSLContext dsl;
    private final JsonMapper json;

    public List<Label> labels() {
        var uses = new HashMap<UUID, Integer>();
        dsl.select(DOCUMENT_LABEL_LINK.LABEL_ID, org.jooq.impl.DSL.count())
                .from(DOCUMENT_LABEL_LINK)
                .join(xyz.goraebap.workspace.jooq.tables.Document.DOCUMENT)
                .on(xyz.goraebap.workspace.jooq.tables.Document.DOCUMENT.DOCUMENT_ID.eq(DOCUMENT_LABEL_LINK.DOCUMENT_ID))
                .where(xyz.goraebap.workspace.jooq.tables.Document.DOCUMENT.DELETED_AT.isNull())
                .groupBy(DOCUMENT_LABEL_LINK.LABEL_ID)
                .forEach(r -> uses.put(r.value1(), r.value2()));
        return dsl.selectFrom(DOCUMENT_LABEL)
                .orderBy(DOCUMENT_LABEL.POSITION, DOCUMENT_LABEL.NAME)
                .fetch(r -> new Label(
                        r.getLabelId(),
                        r.getName(),
                        r.getColor(),
                        r.getPosition(),
                        r.getVersion(),
                        uses.getOrDefault(r.getLabelId(), 0)));
    }

    public Map<UUID, List<UUID>> assignments(UUID project) {
        var result = new HashMap<UUID, List<UUID>>();
        dsl.select(DOCUMENT_LABEL_LINK.DOCUMENT_ID, DOCUMENT_LABEL_LINK.LABEL_ID)
                .from(DOCUMENT_LABEL_LINK)
                .join(xyz.goraebap.workspace.jooq.tables.Document.DOCUMENT)
                .on(xyz.goraebap.workspace.jooq.tables.Document.DOCUMENT.DOCUMENT_ID.eq(DOCUMENT_LABEL_LINK.DOCUMENT_ID))
                .where(xyz.goraebap.workspace.jooq.tables.Document.DOCUMENT.PROJECT_ID.eq(project))
                .forEach(r -> result.computeIfAbsent(r.value1(), unused -> new ArrayList<>())
                        .add(r.value2()));
        return result;
    }

    public List<View> views(UUID project) {
        return dsl.selectFrom(DOCUMENT_VIEW)
                .where(DOCUMENT_VIEW.PROJECT_ID.eq(project))
                .orderBy(DOCUMENT_VIEW.POSITION, DOCUMENT_VIEW.NAME, DOCUMENT_VIEW.VIEW_ID)
                .fetch(r -> new View(
                        r.getViewId(),
                        r.getName(),
                        json.readValue(r.getLabelIds(), IDS),
                        r.getIcon(),
                        r.getColor(),
                        Layout.valueOf(r.getLayout()),
                        Sort.valueOf(r.getSort()),
                        r.getDirection(),
                        r.getVersion()));
    }

    public Order order(UUID project) {
        return dsl.selectFrom(DOCUMENT_LIBRARY_ORDER)
                .where(DOCUMENT_LIBRARY_ORDER.PROJECT_ID.eq(project))
                .fetchOptional(r -> new Order(json.readValue(r.getIds(), IDS), r.getVersion()))
                .orElse(new Order(List.of(), 0));
    }

    public UUID addLabel(String name) {
        var existing = dsl.selectFrom(DOCUMENT_LABEL)
                .where(DOCUMENT_LABEL.NAME.equalIgnoreCase(name))
                .fetchOne();
        if (existing != null) return existing.getLabelId();
        var id = UUID.randomUUID();
        dsl.insertInto(DOCUMENT_LABEL)
                .set(DOCUMENT_LABEL.LABEL_ID, id)
                .set(DOCUMENT_LABEL.NAME, name)
                .set(DOCUMENT_LABEL.COLOR, "#4a90e2")
                .set(
                        DOCUMENT_LABEL.POSITION,
                        dsl.selectCount().from(DOCUMENT_LABEL).fetchOne(0, int.class))
                .execute();
        return id;
    }

    public void assign(UUID document, List<UUID> labels) {
        dsl.deleteFrom(DOCUMENT_LABEL_LINK)
                .where(DOCUMENT_LABEL_LINK.DOCUMENT_ID.eq(document))
                .execute();
        for (var label : labels)
            dsl.insertInto(DOCUMENT_LABEL_LINK)
                    .set(DOCUMENT_LABEL_LINK.DOCUMENT_ID, document)
                    .set(DOCUMENT_LABEL_LINK.LABEL_ID, label)
                    .execute();
    }

    public boolean saveLabel(UUID id, String name, String color, Long expectedVersion) {
        if (expectedVersion == null)
            return dsl.insertInto(DOCUMENT_LABEL)
                            .set(DOCUMENT_LABEL.LABEL_ID, id)
                            .set(DOCUMENT_LABEL.NAME, name)
                            .set(DOCUMENT_LABEL.COLOR, color)
                            .set(
                                    DOCUMENT_LABEL.POSITION,
                                    dsl.selectCount().from(DOCUMENT_LABEL).fetchOne(0, int.class))
                            .execute()
                    == 1;
        return dsl.update(DOCUMENT_LABEL)
                        .set(DOCUMENT_LABEL.NAME, name)
                        .set(DOCUMENT_LABEL.COLOR, color)
                        .set(DOCUMENT_LABEL.VERSION, DOCUMENT_LABEL.VERSION.plus(1))
                        .where(DOCUMENT_LABEL.LABEL_ID.eq(id))
                        .and(DOCUMENT_LABEL.VERSION.eq(expectedVersion))
                        .execute()
                == 1;
    }

    public boolean deleteLabel(UUID id, long expectedVersion) {
        var existing = dsl.selectFrom(DOCUMENT_LABEL)
                .where(DOCUMENT_LABEL.LABEL_ID.eq(id))
                .and(DOCUMENT_LABEL.VERSION.eq(expectedVersion))
                .fetchOne();
        if (existing == null) return false;
        dsl.deleteFrom(DOCUMENT_LABEL_LINK)
                .where(DOCUMENT_LABEL_LINK.LABEL_ID.eq(id))
                .execute();
        for (var view : dsl.selectFrom(DOCUMENT_VIEW).fetch()) {
            var ids = json.readValue(view.getLabelIds(), IDS);
            if (ids.contains(id))
                dsl.update(DOCUMENT_VIEW)
                        .set(
                                DOCUMENT_VIEW.LABEL_IDS,
                                json.writeValueAsString(ids.stream()
                                        .filter(label -> !label.equals(id))
                                        .toList()))
                        .set(DOCUMENT_VIEW.VERSION, DOCUMENT_VIEW.VERSION.plus(1))
                        .where(DOCUMENT_VIEW.VIEW_ID.eq(view.getViewId()))
                        .execute();
        }
        return dsl.deleteFrom(DOCUMENT_LABEL)
                        .where(DOCUMENT_LABEL.LABEL_ID.eq(id))
                        .execute()
                == 1;
    }

    public void orderLabels(List<UUID> ids) {
        var commands = new ArrayList<org.jooq.Query>();
        for (int i = 0; i < ids.size(); i++)
            commands.add(dsl.update(DOCUMENT_LABEL)
                    .set(DOCUMENT_LABEL.POSITION, i)
                    .set(DOCUMENT_LABEL.VERSION, DOCUMENT_LABEL.VERSION.plus(1))
                    .where(DOCUMENT_LABEL.LABEL_ID.eq(ids.get(i))));
        dsl.batch(commands).execute();
    }

    public boolean saveView(UUID project, UUID id, View value, Long expectedVersion) {
        if (expectedVersion == null)
            return dsl.insertInto(DOCUMENT_VIEW)
                            .set(DOCUMENT_VIEW.VIEW_ID, id)
                            .set(DOCUMENT_VIEW.PROJECT_ID, project)
                            .set(DOCUMENT_VIEW.NAME, value.name().strip())
                            .set(DOCUMENT_VIEW.LABEL_IDS, json.writeValueAsString(value.labels()))
                            .set(DOCUMENT_VIEW.ICON, value.icon())
                            .set(DOCUMENT_VIEW.COLOR, value.color())
                            .set(DOCUMENT_VIEW.LAYOUT, value.layout().name())
                            .set(DOCUMENT_VIEW.SORT, value.sort().name())
                            .set(DOCUMENT_VIEW.DIRECTION, value.direction())
                            // 새 뷰는 맨 뒤에.
                            .set(
                                    DOCUMENT_VIEW.POSITION,
                                    dsl.select(org.jooq
                                                    .impl
                                                    .DSL
                                                    .coalesce(org.jooq.impl.DSL.max(DOCUMENT_VIEW.POSITION), -1)
                                                    .plus(1))
                                            .from(DOCUMENT_VIEW)
                                            .where(DOCUMENT_VIEW.PROJECT_ID.eq(project))
                                            .<Integer>asField())
                            .execute()
                    == 1;
        return dsl.update(DOCUMENT_VIEW)
                        .set(DOCUMENT_VIEW.NAME, value.name().strip())
                        .set(DOCUMENT_VIEW.LABEL_IDS, json.writeValueAsString(value.labels()))
                        .set(DOCUMENT_VIEW.ICON, value.icon())
                        .set(DOCUMENT_VIEW.COLOR, value.color())
                        .set(DOCUMENT_VIEW.LAYOUT, value.layout().name())
                        .set(DOCUMENT_VIEW.SORT, value.sort().name())
                        .set(DOCUMENT_VIEW.DIRECTION, value.direction())
                        .set(DOCUMENT_VIEW.VERSION, DOCUMENT_VIEW.VERSION.plus(1))
                        .where(DOCUMENT_VIEW.VIEW_ID.eq(id))
                        .and(DOCUMENT_VIEW.PROJECT_ID.eq(project))
                        .and(DOCUMENT_VIEW.VERSION.eq(expectedVersion))
                        .execute()
                == 1;
    }

    public void orderViews(UUID project, List<UUID> ids) {
        var commands = new ArrayList<org.jooq.Query>();
        for (int i = 0; i < ids.size(); i++)
            commands.add(dsl.update(DOCUMENT_VIEW)
                    .set(DOCUMENT_VIEW.POSITION, i)
                    .where(DOCUMENT_VIEW.VIEW_ID.eq(ids.get(i)))
                    .and(DOCUMENT_VIEW.PROJECT_ID.eq(project)));
        dsl.batch(commands).execute();
    }

    public boolean deleteView(UUID project, UUID id, long version) {
        return dsl.deleteFrom(DOCUMENT_VIEW)
                        .where(DOCUMENT_VIEW.VIEW_ID.eq(id))
                        .and(DOCUMENT_VIEW.PROJECT_ID.eq(project))
                        .and(DOCUMENT_VIEW.VERSION.eq(version))
                        .execute()
                == 1;
    }

    public boolean order(UUID project, Order value) {
        dsl.insertInto(DOCUMENT_LIBRARY_ORDER)
                .set(DOCUMENT_LIBRARY_ORDER.PROJECT_ID, project)
                .onConflictDoNothing()
                .execute();
        return dsl.update(DOCUMENT_LIBRARY_ORDER)
                        .set(DOCUMENT_LIBRARY_ORDER.IDS, json.writeValueAsString(value.ids()))
                        .set(DOCUMENT_LIBRARY_ORDER.VERSION, DOCUMENT_LIBRARY_ORDER.VERSION.plus(1))
                        .where(DOCUMENT_LIBRARY_ORDER.PROJECT_ID.eq(project))
                        .and(DOCUMENT_LIBRARY_ORDER.VERSION.eq(value.version()))
                        .execute()
                == 1;
    }
}

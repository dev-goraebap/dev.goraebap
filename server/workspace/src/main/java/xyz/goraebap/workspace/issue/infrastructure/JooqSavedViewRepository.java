package xyz.goraebap.workspace.issue.infrastructure;

import static xyz.goraebap.workspace.jooq.tables.IssueView.ISSUE_VIEW;
import static xyz.goraebap.workspace.jooq.tables.IssueViewOrder.ISSUE_VIEW_ORDER;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Query;
import org.springframework.stereotype.Repository;
import xyz.goraebap.workspace.jooq.tables.records.IssueViewRecord;
import xyz.goraebap.workspace.issue.domain.view.SavedView;
import xyz.goraebap.workspace.issue.domain.view.SavedViewRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

@Repository
@RequiredArgsConstructor
class JooqSavedViewRepository implements SavedViewRepository {
    private static final String AREA = "area";
    private static final TypeReference<LinkedHashMap<String, String>> FILTERS = new TypeReference<>() {};
    private static final TypeReference<List<String>> KEYS = new TypeReference<>() {};

    private final DSLContext dslContext;
    private final JsonMapper jsonMapper;

    @Override
    public List<SavedView> findAllVisible(UUID projectId, UUID userId) {
        return dslContext
                .selectFrom(ISSUE_VIEW)
                .where(scope(projectId))
                .and(ISSUE_VIEW.IS_PERSONAL.isFalse().or(ISSUE_VIEW.OWNER_ID.eq(userId)))
                .orderBy(ISSUE_VIEW.CREATED_AT, ISSUE_VIEW.VIEW_ID)
                .fetch(this::view);
    }

    @Override
    public Optional<SavedView> findById(UUID id) {
        return dslContext
                .selectFrom(ISSUE_VIEW)
                .where(ISSUE_VIEW.VIEW_ID.eq(id))
                .fetchOptional(this::view);
    }

    @Override
    public void save(SavedView view, UUID actor, Instant now) {
        upsert(view, actor, now).execute();
    }

    @Override
    public void saveAll(List<SavedView> views, UUID actor, Instant now) {
        if (views.isEmpty()) return;
        dslContext
                .batch(views.stream().map(view -> upsert(view, actor, now)).toList())
                .execute();
    }

    @Override
    public void deleteById(UUID id) {
        dslContext.deleteFrom(ISSUE_VIEW).where(ISSUE_VIEW.VIEW_ID.eq(id)).execute();
    }

    @Override
    public List<String> findOrder(UUID projectId) {
        return dslContext
                .select(ISSUE_VIEW_ORDER.VIEW_KEYS)
                .from(ISSUE_VIEW_ORDER)
                .where(ISSUE_VIEW_ORDER.SCOPE.eq(scopeKey(projectId)))
                .fetchOptional(ISSUE_VIEW_ORDER.VIEW_KEYS)
                .map(keys -> jsonMapper.readValue(keys, KEYS))
                .orElse(List.of());
    }

    @Override
    public void saveOrder(UUID projectId, List<String> keys, UUID actor, Instant now) {
        String json = jsonMapper.writeValueAsString(keys);
        dslContext
                .insertInto(ISSUE_VIEW_ORDER)
                .set(ISSUE_VIEW_ORDER.SCOPE, scopeKey(projectId))
                .set(ISSUE_VIEW_ORDER.VIEW_KEYS, json)
                .set(ISSUE_VIEW_ORDER.UPDATED_AT, now)
                .set(ISSUE_VIEW_ORDER.UPDATED_BY, actor)
                .onConflict(ISSUE_VIEW_ORDER.SCOPE)
                .doUpdate()
                .set(ISSUE_VIEW_ORDER.VIEW_KEYS, json)
                .set(ISSUE_VIEW_ORDER.UPDATED_AT, now)
                .set(ISSUE_VIEW_ORDER.UPDATED_BY, actor)
                .execute();
    }

    private Query upsert(SavedView view, UUID actor, Instant now) {
        var d = view.definition();
        String filters = jsonMapper.writeValueAsString(d.orderedFilters());
        return dslContext
                .insertInto(ISSUE_VIEW)
                .set(ISSUE_VIEW.VIEW_ID, view.id())
                .set(ISSUE_VIEW.PROJECT_ID, view.projectId())
                .set(ISSUE_VIEW.OWNER_ID, view.ownerId())
                .set(ISSUE_VIEW.IS_PERSONAL, view.personal())
                .set(ISSUE_VIEW.NAME, d.name())
                .set(ISSUE_VIEW.ICON, d.icon())
                .set(ISSUE_VIEW.COLOR, d.color())
                .set(ISSUE_VIEW.LAYOUT, d.layout().name())
                .set(ISSUE_VIEW.FILTERS, filters)
                .set(ISSUE_VIEW.SORT, d.sort().name())
                .set(ISSUE_VIEW.DIRECTION, d.direction().name())
                .set(ISSUE_VIEW.GROUPING, d.grouping().name())
                .set(ISSUE_VIEW.VERSION, view.version())
                .set(ISSUE_VIEW.CREATED_AT, now)
                .set(ISSUE_VIEW.CREATED_BY, actor)
                .set(ISSUE_VIEW.UPDATED_AT, now)
                .set(ISSUE_VIEW.UPDATED_BY, actor)
                .onConflict(ISSUE_VIEW.VIEW_ID)
                .doUpdate()
                .set(ISSUE_VIEW.IS_PERSONAL, view.personal())
                .set(ISSUE_VIEW.NAME, d.name())
                .set(ISSUE_VIEW.ICON, d.icon())
                .set(ISSUE_VIEW.COLOR, d.color())
                .set(ISSUE_VIEW.LAYOUT, d.layout().name())
                .set(ISSUE_VIEW.FILTERS, filters)
                .set(ISSUE_VIEW.SORT, d.sort().name())
                .set(ISSUE_VIEW.DIRECTION, d.direction().name())
                .set(ISSUE_VIEW.GROUPING, d.grouping().name())
                .set(ISSUE_VIEW.VERSION, view.version())
                .set(ISSUE_VIEW.UPDATED_AT, now)
                .set(ISSUE_VIEW.UPDATED_BY, actor);
    }

    private SavedView view(IssueViewRecord row) {
        Map<String, String> filters = jsonMapper.readValue(row.getFilters(), FILTERS);
        var definition = new SavedView.Definition(
                row.getName(),
                row.getIcon(),
                row.getColor(),
                SavedView.Layout.valueOf(row.getLayout()),
                filters,
                SavedView.SortKey.valueOf(row.getSort()),
                SavedView.Direction.valueOf(row.getDirection()),
                SavedView.Grouping.valueOf(row.getGrouping()));
        return SavedView.fromPersistence(
                row.getViewId(),
                row.getProjectId(),
                row.getOwnerId(),
                Boolean.TRUE.equals(row.getIsPersonal()),
                definition,
                row.getVersion());
    }

    private static Condition scope(UUID projectId) {
        return projectId == null ? ISSUE_VIEW.PROJECT_ID.isNull() : ISSUE_VIEW.PROJECT_ID.eq(projectId);
    }

    /** The order's scope: the area's, or the project's id. */
    private static String scopeKey(UUID projectId) {
        return projectId == null ? AREA : projectId.toString();
    }
}

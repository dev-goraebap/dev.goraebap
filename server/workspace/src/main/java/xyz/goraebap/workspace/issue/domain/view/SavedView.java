package xyz.goraebap.workspace.issue.domain.view;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.foundation.shared.error.DomainRuleViolation;

/**
 * A saved view over issues (BIT's views, D-066 · D-068 · D-088 · D-106): the pills over an issue list. It belongs to
 * the area's list across projects (no project) or to one project's, and is shared with everyone or personal to its
 * owner. The built-in 전체 이슈 is not stored; {@link #ALL} names it in a scope's order.
 */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class SavedView {
    public static final String ALL = "all";
    public static final int NAME_MAX = 32;
    public static final int ICON_MAX = 64;
    public static final String COLOR_PATTERN = "^#[0-9a-fA-F]{6}$";
    public static final int FILTER_VALUE_MAX = 1000;
    /** The filters a view keeps, as an issue list's address names them; project only across the area. */
    public static final List<String> FILTER_KEYS =
            List.of("project", "status", "assignee", "label", "type", "priority", "cycle");

    private static final Pattern COLOR = Pattern.compile(COLOR_PATTERN);
    private static final Pattern ICON = Pattern.compile("^[a-z0-9:-]+$");
    private static final Pattern FILTER_VALUE = Pattern.compile("^[A-Za-z0-9_-]+(,[A-Za-z0-9_-]+)*$");

    /** How the issues are laid out: rows grouped (목록), a project's board, or their days on a timeline (타임라인). */
    public enum Layout {
        LIST,
        BOARD,
        TIMELINE
    }

    /** What a list's rows are grouped by; PROJECT only across the area. A board is always by status. */
    public enum Grouping {
        STATUS,
        ASSIGNEE,
        PRIORITY,
        TYPE,
        PROJECT,
        NONE
    }

    /** The order the issues run in, as the issue lists take it; BOARD only in a project, and only ascending. */
    public enum SortKey {
        BOARD,
        UPDATED,
        CREATED
    }

    public enum Direction {
        ASC,
        DESC
    }

    /** What a view shows. Build it with {@link #of}, which checks it against the scope; filters keep non-blank values. */
    public record Definition(
            String name,
            String icon,
            String color,
            Layout layout,
            Map<String, String> filters,
            SortKey sort,
            Direction direction,
            Grouping grouping) {
        public Definition {
            filters = Map.copyOf(filters);
        }

        public static Definition of(
                boolean inProject,
                String name,
                String icon,
                String color,
                Layout layout,
                Map<String, String> filters,
                SortKey sort,
                Direction direction,
                Grouping grouping) {
            String cleanName = name == null ? "" : name.strip();
            if (cleanName.isEmpty() || cleanName.length() > NAME_MAX) throw new DomainRuleViolation("뷰 이름은 1~32자입니다");
            if (icon == null || icon.length() > ICON_MAX || !ICON.matcher(icon).matches())
                throw new DomainRuleViolation("아이콘을 고를 수 없습니다");
            if (color == null || !COLOR.matcher(color).matches()) throw new DomainRuleViolation("색은 #RRGGBB입니다");
            if (layout == null || sort == null || direction == null || grouping == null)
                throw new DomainRuleViolation("뷰의 보기 방식 · 정렬 · 묶기를 정해 주세요");
            if (!inProject && sort == SortKey.BOARD) throw new DomainRuleViolation("보드 순서는 프로젝트 안에서만 쓸 수 있습니다");
            if (inProject && grouping == Grouping.PROJECT) throw new DomainRuleViolation("프로젝트로 묶기는 전체 이슈에서만 됩니다");
            if (sort == SortKey.BOARD && direction != Direction.ASC)
                throw new DomainRuleViolation("보드 순서는 앞에서부터만 읽습니다");
            return new Definition(
                    cleanName,
                    icon,
                    color.toLowerCase(Locale.ROOT),
                    layout,
                    cleanFilters(inProject, filters),
                    sort,
                    direction,
                    grouping);
        }

        /** The filters in {@link #FILTER_KEYS} order, for storage and responses. */
        public Map<String, String> orderedFilters() {
            var ordered = new LinkedHashMap<String, String>();
            for (String key : FILTER_KEYS) if (filters.containsKey(key)) ordered.put(key, filters.get(key));
            return ordered;
        }
    }

    @EqualsAndHashCode.Include
    private final UUID id;

    private final UUID projectId;
    private final UUID ownerId;
    private boolean personal;
    private Definition definition;
    private long version;

    public static SavedView create(UUID id, UUID projectId, UUID ownerId, boolean personal, Definition definition) {
        if (personal && ownerId == null) throw new DomainRuleViolation("나만 보는 뷰에는 주인이 있어야 합니다");
        return new SavedView(id, projectId, ownerId, personal, Objects.requireNonNull(definition, "definition"), 0);
    }

    public static SavedView fromPersistence(
            UUID id, UUID projectId, UUID ownerId, boolean personal, Definition definition, long version) {
        return new SavedView(id, projectId, ownerId, personal, definition, version);
    }

    /** 전체 다음에 놓는 기본 뷰. 프로젝트의 백로그는 실제 열 ID로 선택한다. */
    public static List<Definition> starters(boolean inProject, String backlogStatus) {
        var sort = inProject ? SortKey.BOARD : SortKey.UPDATED;
        var direction = inProject ? Direction.ASC : Direction.DESC;
        return List.of(
                // 보기 방식이 아니라 무엇을 보는지로 이름 짓는다(2026-11-11): 진행 현황(칸반), 백로그, 일정 계획(타임라인).
                Definition.of(
                        inProject,
                        "진행 현황",
                        "layout-board",
                        "#f2c94c",
                        Layout.BOARD,
                        Map.of(),
                        sort,
                        direction,
                        Grouping.STATUS),
                Definition.of(
                        inProject,
                        "백로그",
                        "layout-list",
                        "#4cb782",
                        Layout.LIST,
                        Map.of("status", backlogStatus),
                        sort,
                        direction,
                        Grouping.STATUS),
                Definition.of(
                        inProject,
                        "일정 계획",
                        "layout-timeline",
                        "#5e6ad2",
                        Layout.TIMELINE,
                        Map.of(),
                        sort,
                        direction,
                        Grouping.NONE));
    }

    public boolean visibleTo(UUID userId) {
        return !personal || ownerId.equals(userId);
    }

    public boolean ownedBy(UUID userId) {
        return ownerId != null && ownerId.equals(userId);
    }

    /** Changes what the view shows and whether it is personal; only a view with an owner can be personal. */
    public void revise(Definition next, boolean nextPersonal) {
        Objects.requireNonNull(next, "definition");
        if (nextPersonal && ownerId == null) throw new DomainRuleViolation("나만 보는 뷰에는 주인이 있어야 합니다");
        if (next.equals(definition) && nextPersonal == personal) return;
        definition = next;
        personal = nextPersonal;
        version++;
    }

    private static Map<String, String> cleanFilters(boolean inProject, Map<String, String> filters) {
        var clean = new LinkedHashMap<String, String>();
        if (filters == null) return clean;
        for (var entry : filters.entrySet()) {
            String value = entry.getValue() == null ? "" : entry.getValue().strip();
            if (value.isEmpty()) continue;
            if (!FILTER_KEYS.contains(entry.getKey())
                    || inProject && entry.getKey().equals("project")
                    || value.length() > FILTER_VALUE_MAX
                    || !FILTER_VALUE.matcher(value).matches()) throw new DomainRuleViolation("뷰의 필터를 읽을 수 없습니다");
            clean.put(entry.getKey(), value);
        }
        return clean;
    }
}

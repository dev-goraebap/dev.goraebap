package xyz.goraebap.workspace.project.domain;

import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.foundation.shared.error.DomainRuleViolation;

/**
 * A project, as BIT's: its name, description and mark (an icon name and a colour, either absent); its key, the prefix of
 * its work item numbers, which may change while its old keys stay its own; its place in the shared order; and its version.
 * An archived project is read but not written; a deleted one is kept for what still names it and can be restored.
 */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Project {
    public static final int NAME_MAX = 64;
    public static final int DESCRIPTION_MAX = 20_000;
    public static final int ICON_MAX = 32;
    public static final String KEY_PATTERN = "^[A-Za-z0-9]{2,10}$";
    public static final String COLOR_PATTERN = "^#[0-9a-fA-F]{6}$";

    /** Keys the area's own addresses take beside a project's (/projects/members, /projects/issues …). */
    public static final Set<String> RESERVED_KEYS =
            Set.of("ALL", "ADMIN", "NEW", "MEMBERS", "ISSUES", "DOCUMENTS", "FAVORITES", "ORDER", "SETTINGS");

    private static final Pattern KEY = Pattern.compile("[A-Z0-9]{2,10}");
    private static final Pattern COLOR = Pattern.compile(COLOR_PATTERN);

    @EqualsAndHashCode.Include
    private final UUID id;

    private String key;
    private String name;
    private String description;
    private String icon;
    private String color;
    private final int position;
    private Instant archivedAt;
    private Instant deletedAt;
    private final long version;

    /** A new project at the end of the order. */
    public static Project create(
            UUID id, String key, String name, String description, String icon, String color, int position) {
        var project = new Project(id, null, null, null, null, null, position, null, null, 0);
        project.revise(key, name, description, icon, color);
        return project;
    }

    public static Project fromPersistence(
            UUID id,
            String key,
            String name,
            String description,
            String icon,
            String color,
            int position,
            Instant archivedAt,
            Instant deletedAt,
            long version) {
        return new Project(id, key, name, description, icon, color, position, archivedAt, deletedAt, version);
    }

    /** The key as stored: trimmed and in capitals, two to ten letters or digits. */
    public static String normalKey(String key) {
        String normal = key == null ? "" : key.strip().toUpperCase(Locale.ROOT);
        if (!KEY.matcher(normal).matches()) throw new DomainRuleViolation("프로젝트 키는 영문·숫자 2~10자입니다");
        if (RESERVED_KEYS.contains(normal)) throw new DomainRuleViolation("이 키는 화면 주소가 쓰고 있어 쓸 수 없습니다");
        return normal;
    }

    /** Changes everything the settings show at once; refused while archived. */
    public void revise(String key, String name, String description, String icon, String color) {
        if (archivedAt != null) throw new DomainRuleViolation("보관한 프로젝트는 고칠 수 없습니다");
        String nextKey = normalKey(key);
        String nextName = name == null ? "" : name.strip();
        if (nextName.isEmpty() || nextName.length() > NAME_MAX) throw new DomainRuleViolation("프로젝트 이름은 1~64자입니다");
        String nextDescription = description == null || description.isBlank() ? null : description;
        if (nextDescription != null && nextDescription.length() > DESCRIPTION_MAX)
            throw new DomainRuleViolation("설명은 20000자까지입니다");
        String nextIcon = icon == null || icon.isBlank() ? null : icon.strip();
        if (nextIcon != null && nextIcon.length() > ICON_MAX) throw new DomainRuleViolation("아이콘 이름이 너무 깁니다");
        if (color != null && !COLOR.matcher(color).matches()) throw new DomainRuleViolation("색은 #RRGGBB입니다");
        this.key = nextKey;
        this.name = nextName;
        this.description = nextDescription;
        this.icon = nextIcon;
        this.color = color == null ? null : color.toLowerCase(Locale.ROOT);
    }

    public void archive(Instant now) {
        if (deletedAt != null) throw new DomainRuleViolation("삭제한 프로젝트입니다");
        if (archivedAt == null) archivedAt = now;
    }

    public void unarchive() {
        archivedAt = null;
    }

    public void delete(Instant now) {
        if (deletedAt == null) deletedAt = now;
    }

    public void restore() {
        deletedAt = null;
    }

    public boolean isArchived() {
        return archivedAt != null;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }
}

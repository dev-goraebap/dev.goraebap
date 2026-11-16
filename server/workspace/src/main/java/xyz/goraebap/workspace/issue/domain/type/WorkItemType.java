package xyz.goraebap.workspace.issue.domain.type;

import java.util.Locale;
import java.util.regex.Pattern;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.foundation.shared.error.DomainRuleViolation;

/**
 * A work item type of the workspace (BIT D-104; 결정기록 2026-11-04 프로젝트 관리): its code (what an issue keeps),
 * name unique whatever its case, mark (a Solar icon in a #RRGGBB colour) and place in the menus; one is the default.
 */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class WorkItemType {
    public static final int NAME_MAX = 32;
    public static final int ICON_MAX = 40;
    public static final String COLOR_PATTERN = "^#[0-9a-fA-F]{6}$";
    private static final Pattern COLOR = Pattern.compile(COLOR_PATTERN);
    private static final Pattern ICON = Pattern.compile("^[a-z0-9-]{1,40}$");

    @EqualsAndHashCode.Include
    private final String code;

    private String name;
    private String icon;
    private String color;
    private final int position;
    private final boolean isDefault;

    public static WorkItemType create(String code, String name, String icon, String color, int position) {
        var type = new WorkItemType(code, null, null, null, position, false);
        type.revise(name, icon, color);
        return type;
    }

    public static WorkItemType fromPersistence(
            String code, String name, String icon, String color, int position, boolean isDefault) {
        return new WorkItemType(code, name, icon, color, position, isDefault);
    }

    public void revise(String name, String icon, String color) {
        String next = name == null ? "" : name.strip();
        if (next.isEmpty() || next.length() > NAME_MAX) throw new DomainRuleViolation("유형 이름은 1~32자입니다");
        if (icon == null || !ICON.matcher(icon).matches()) throw new DomainRuleViolation("아이콘 이름이 올바르지 않습니다");
        if (color == null || !COLOR.matcher(color).matches()) throw new DomainRuleViolation("색은 #RRGGBB입니다");
        this.name = next;
        this.icon = icon;
        this.color = color.toLowerCase(Locale.ROOT);
    }
}

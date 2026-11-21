package xyz.goraebap.productivity.issue.domain.label;

import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.shared.error.DomainRuleViolation;

/**
 * A label of the workspace, put on the issues of every project (BIT D-009; 결정기록 2026-11-04 프로젝트 관리): a name
 * unique whatever its case, a colour, and its place in the menus.
 */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class IssueLabel {
    public static final int NAME_MAX = 32;
    public static final String COLOR_PATTERN = "^#[0-9a-fA-F]{6}$";
    private static final Pattern COLOR = Pattern.compile(COLOR_PATTERN);

    @EqualsAndHashCode.Include
    private final UUID id;

    private String name;
    private String color;
    private final int position;

    public static IssueLabel create(UUID id, String name, String color, int position) {
        var label = new IssueLabel(id, null, null, position);
        label.revise(name, color);
        return label;
    }

    public static IssueLabel fromPersistence(UUID id, String name, String color, int position) {
        return new IssueLabel(id, name, color, position);
    }

    public void revise(String name, String color) {
        String next = name == null ? "" : name.strip();
        if (next.isEmpty() || next.length() > NAME_MAX) throw new DomainRuleViolation("라벨 이름은 1~32자입니다");
        if (color == null || !COLOR.matcher(color).matches()) throw new DomainRuleViolation("색은 #RRGGBB입니다");
        this.name = next;
        this.color = color.toLowerCase(Locale.ROOT);
    }
}

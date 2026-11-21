package xyz.goraebap.cowork.module.workspace.document.domain;

import java.util.Locale;
import java.util.regex.Pattern;
import xyz.goraebap.cowork.shared.error.DomainRuleViolation;

/**
 * How a document or a folder is marked in 문서함, as a project is: an icon name (the screens' mark icons, or a Solar one
 * as s:name) and a #RRGGBB colour, kept in lower case; either may be absent, and with neither the screen draws the
 * kind's own icon (a folder's, a page's, a 매뉴얼's) in the quiet ink.
 */
public record Mark(String icon, String color) {
    public static final int ICON_MAX = 64;
    public static final String COLOR_PATTERN = "^#[0-9a-fA-F]{6}$";
    public static final Mark NONE = new Mark(null, null);

    private static final Pattern COLOR = Pattern.compile(COLOR_PATTERN);

    /** The mark checked: a blank icon is none, a colour is #RRGGBB. */
    public static Mark of(String icon, String color) {
        String nextIcon = icon == null || icon.isBlank() ? null : icon.strip();
        if (nextIcon != null && nextIcon.length() > ICON_MAX) throw new DomainRuleViolation("아이콘 이름이 너무 깁니다");
        String nextColor = color == null || color.isBlank() ? null : color.strip();
        if (nextColor != null && !COLOR.matcher(nextColor).matches()) throw new DomainRuleViolation("색은 #RRGGBB입니다");
        return new Mark(nextIcon, nextColor == null ? null : nextColor.toLowerCase(Locale.ROOT));
    }
}

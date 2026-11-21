package xyz.goraebap.shared.web;

import java.util.List;
import java.util.Objects;

/**
 * A list query parameter as a list filter reads it. A comma list may hold an empty item ({@code ?tagId=a,}), which
 * binds as a missing or blank value; every list drops those and repeats, so an empty item narrows nothing and a
 * missing parameter is an empty list rather than an error. A record keeping the result still writes
 * {@code List.copyOf(ListParams.values(given))}: the copy returns the same unmodifiable list, and lets SpotBugs see
 * that the component cannot be changed from outside.
 */
public final class ListParams {
    private ListParams() {}

    /** The values given, without missing ones or repeats, in their order; empty when none were given. */
    public static <T> List<T> values(List<T> given) {
        if (given == null) return List.of();
        return List.copyOf(given.stream().filter(Objects::nonNull).distinct().toList());
    }

    /** The words given, trimmed, without blank ones or repeats, in their order; empty when none were given. */
    public static List<String> strings(List<String> given) {
        if (given == null) return List.of();
        return List.copyOf(given.stream()
                .filter(each -> each != null && !each.isBlank())
                .map(String::trim)
                .distinct()
                .toList());
    }
}

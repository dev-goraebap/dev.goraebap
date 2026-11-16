package xyz.goraebap.foundation.notification;

import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * The one thing a notice is about, named by the domain that sends it: its kind of thing (ISSUE, say) and that thing's
 * id. Notices about the same thing are settled together, whichever of them the member opened and however they reached
 * the thing itself. This module gives the type no meaning beyond telling subjects apart.
 */
public record Subject(String type, UUID id) {
    private static final Pattern TYPE = Pattern.compile("[A-Z][A-Z0-9_]{1,31}");

    public Subject {
        if (type == null || !TYPE.matcher(type).matches())
            throw new IllegalArgumentException("알림 대상의 종류가 올바르지 않습니다");
        Objects.requireNonNull(id, "id");
    }

    public static Subject of(String type, UUID id) {
        return new Subject(type, id);
    }
}

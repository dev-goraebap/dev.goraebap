package xyz.goraebap.module.workspace.activity;

import java.time.Instant;
import java.util.UUID;

/**
 * Something that happened to an owner, for its timeline: the field (the owner's own name for it, CREATED, TITLE, BODY …)
 * and its values before and after as the timeline shows them, at most 400 letters each.
 */
public record ActivityEvent(String field, String before, String after, Instant at, UUID actorId) {
    public static final int VALUE_MAX = 400;

    public ActivityEvent {
        before = clip(before);
        after = clip(after);
    }

    private static String clip(String value) {
        return value == null || value.length() <= VALUE_MAX ? value : value.substring(0, VALUE_MAX);
    }
}

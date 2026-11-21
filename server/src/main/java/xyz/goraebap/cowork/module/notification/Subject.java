package xyz.goraebap.cowork.module.notification;

import java.util.Objects;
import java.util.UUID;

/**
 * The one thing a notice is about (a work item). Notices about the same thing are settled together, whichever of them
 * the member opened and however they reached the thing itself.
 */
public record Subject(Type type, UUID id) {
    public enum Type {
        ISSUE
    }

    public Subject {
        Objects.requireNonNull(type, "type");
        Objects.requireNonNull(id, "id");
    }

    public static Subject issue(UUID id) {
        return new Subject(Type.ISSUE, id);
    }
}

package xyz.goraebap.shared.web;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.regex.Pattern;

/**
 * A role a member holds for the whole instance, named as the Spring authority it grants. None holds another. This
 * module knows only INSTANCE_ADMIN; a domain names its own roles and offers them through RoleSpi.
 */
@Schema(type = "string", example = "INSTANCE_ADMIN")
public record Role(@JsonValue String name) implements Comparable<Role> {
    private static final Pattern NAME = Pattern.compile("[A-Z][A-Z0-9_]{1,31}");

    /** Runs the system screens (status, push delivery) and gives out roles. */
    public static final Role INSTANCE_ADMIN = new Role("INSTANCE_ADMIN");

    public Role {
        if (name == null || !NAME.matcher(name).matches()) throw new IllegalArgumentException("역할 이름이 올바르지 않습니다");
    }

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static Role valueOf(String name) {
        return new Role(name);
    }

    /** INSTANCE_ADMIN first, the rest by name. */
    @Override
    public int compareTo(Role other) {
        boolean admin = equals(INSTANCE_ADMIN);
        boolean otherAdmin = other.equals(INSTANCE_ADMIN);
        if (admin != otherAdmin) return admin ? -1 : 1;
        return name.compareTo(other.name);
    }

    @Override
    public String toString() {
        return name;
    }
}

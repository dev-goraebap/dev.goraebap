package xyz.goraebap.module.foundation.user.application.role;

import jakarta.validation.constraints.NotNull;
import java.util.Set;
import xyz.goraebap.shared.web.Role;

public final class RoleRequests {
    private RoleRequests() {}

    /** Every role the member is to hold, replacing what they hold; empty makes them an ordinary member. */
    public record RoleChange(@NotNull Set<@NotNull Role> roles) {
        public RoleChange {
            roles = roles == null ? null : Set.copyOf(roles);
        }
    }
}

package xyz.goraebap.foundation.user.application.role;

import java.util.Collections;
import java.util.TreeSet;
import java.util.Set;
import java.util.UUID;
import xyz.goraebap.foundation.shared.web.Role;

public final class RoleViews {
    private RoleViews() {}

    /** A member who has not left, with the roles they hold in the roles' own order; empty for an ordinary member. */
    public record RoleMember(UUID id, String name, String email, Set<Role> roles) {
        public RoleMember {
            var sorted = new TreeSet<Role>();
            sorted.addAll(roles);
            roles = Collections.unmodifiableSet(sorted);
        }
    }
}

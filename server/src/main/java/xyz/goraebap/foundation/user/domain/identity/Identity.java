package xyz.goraebap.foundation.user.domain.identity;

import java.util.Set;
import java.util.UUID;
import xyz.goraebap.shared.web.Role;

/**
 * A member allowed to sign in, with the name shown for them, the roles they hold, and whether they finished the
 * first-login onboarding.
 */
public record Identity(UUID id, String email, String name, Set<Role> roles, boolean onboarded) {
    public Identity {
        roles = Set.copyOf(roles);
    }
}

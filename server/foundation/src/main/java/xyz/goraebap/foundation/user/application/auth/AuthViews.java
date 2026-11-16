package xyz.goraebap.foundation.user.application.auth;

import java.time.Instant;
import java.util.Collections;
import java.util.TreeSet;
import java.util.Set;
import java.util.UUID;
import xyz.goraebap.foundation.user.application.AuthErrorCode;
import xyz.goraebap.foundation.shared.web.CurrentUser;
import xyz.goraebap.foundation.shared.web.Role;

public final class AuthViews {
    private AuthViews() {}

    /**
     * The signed-in member; roles lists what they hold in the roles' own order, empty for an ordinary member, and
     * onboarded is false until they finish the first-login onboarding, which screens show first.
     */
    public record Me(UUID id, String email, String name, Set<Role> roles, boolean onboarded, Instant expiresAt)
            implements CurrentUser {
        public Me {
            var sorted = new TreeSet<Role>();
            sorted.addAll(roles);
            roles = Collections.unmodifiableSet(sorted);
        }
    }

    public record Issued(String token, Instant expiresAt) {}

    public record Verified(Issued issued, AuthErrorCode error) {}

    public record Member(UUID id, String name, String email) {}
}

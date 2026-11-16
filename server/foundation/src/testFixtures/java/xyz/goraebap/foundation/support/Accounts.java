package xyz.goraebap.foundation.support;

import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import xyz.goraebap.foundation.shared.persistence.InstantTextBinding;
import xyz.goraebap.foundation.shared.web.Role;

/**
 * Accounts put straight into the test database: the users row a member signs in with, made or updated, and the roles
 * they hold, replaced as a whole.
 */
public final class Accounts {
    private static final Role[] NONE = {};

    private Accounts() {}

    /** Makes or updates the account with the e-mail and whether it may sign in, holding exactly the given roles. */
    public static void upsert(JdbcTemplate jdbc, UUID id, String email, boolean active, Role... roles) {
        jdbc.update(
                "INSERT INTO users(user_id,email,is_active) VALUES (?,?,?)"
                        + " ON CONFLICT(user_id) DO UPDATE SET email=excluded.email, is_active=excluded.is_active",
                id,
                email,
                active);
        roles(jdbc, id, roles);
    }

    /** The member holds exactly the given roles from now on; the account must exist. */
    public static void roles(JdbcTemplate jdbc, UUID id, Role... roles) {
        jdbc.update("DELETE FROM user_role WHERE user_id=?", id);
        for (var role : roles)
            jdbc.update(
                    "INSERT INTO user_role(user_id,role,granted_at) VALUES (?,?,?)",
                    id,
                    role.name(),
                    InstantTextBinding.text(Instant.now()));
    }

    /** The given roles when the test's member is an administrator, none otherwise. */
    public static Role[] when(boolean admin, Role... roles) {
        return admin ? roles : NONE;
    }

    /** Every role, for an administrator whose test does not care which one it uses. */
    public static Role[] all() {
        return TestRoles.ALL;
    }
}

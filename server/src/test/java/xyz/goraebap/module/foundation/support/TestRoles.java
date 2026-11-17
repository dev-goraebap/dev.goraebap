package xyz.goraebap.module.foundation.support;

import java.util.Collection;
import java.util.List;
import org.springframework.stereotype.Component;
import xyz.goraebap.shared.web.Role;
import xyz.goraebap.module.foundation.user.RoleSpi;

/** Two roles a domain might add, so the tests give out more than INSTANCE_ADMIN. */
@Component
public class TestRoles implements RoleSpi {
    public static final Role TEAM_ADMIN = Role.valueOf("TEAM_ADMIN");
    public static final Role SPACE_ADMIN = Role.valueOf("SPACE_ADMIN");
    public static final Role[] ALL = {Role.INSTANCE_ADMIN, SPACE_ADMIN, TEAM_ADMIN};

    @Override
    public Collection<Role> roles() {
        return List.of(TEAM_ADMIN, SPACE_ADMIN);
    }
}

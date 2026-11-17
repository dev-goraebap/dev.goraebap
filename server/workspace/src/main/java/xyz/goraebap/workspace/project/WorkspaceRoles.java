package xyz.goraebap.workspace.project;

import java.util.Collection;
import java.util.List;
import org.springframework.stereotype.Component;
import xyz.goraebap.foundation.shared.web.CurrentUser;
import xyz.goraebap.foundation.shared.web.Role;
import xyz.goraebap.foundation.user.RoleSpi;

/** The role the workspace adds to the instance: its administrator, who runs every project and the workspace's settings. */
@Component
public class WorkspaceRoles implements RoleSpi {
    /** Also the Spring authority of the same name. */
    public static final Role ADMIN = Role.valueOf("WORKSPACE_ADMIN");

    public static boolean admin(CurrentUser user) {
        return user.holds(ADMIN);
    }

    @Override
    public Collection<Role> roles() {
        return List.of(ADMIN);
    }
}

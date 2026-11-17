package xyz.goraebap.module.foundation.user.application.role;

import java.util.List;

public interface RoleQuery {
    /** Members who have not left (invited or working), by name, with the roles each holds. */
    List<RoleViews.RoleMember> findMembers();
}

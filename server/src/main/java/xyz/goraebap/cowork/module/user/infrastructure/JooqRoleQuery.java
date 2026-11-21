package xyz.goraebap.cowork.module.user.infrastructure;

import static xyz.goraebap.cowork.jooq.tables.UserRole.USER_ROLE;
import static xyz.goraebap.cowork.jooq.tables.Users.USERS;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.cowork.module.user.UserStatus;
import xyz.goraebap.cowork.module.user.application.role.RoleQuery;
import xyz.goraebap.cowork.module.user.application.role.RoleViews;
import xyz.goraebap.cowork.shared.web.Role;

@Repository
@RequiredArgsConstructor
class JooqRoleQuery implements RoleQuery {
    private final DSLContext dslContext;

    public List<RoleViews.RoleMember> findMembers() {
        Map<UUID, List<Role>> held = new HashMap<>();
        dslContext
                .select(USER_ROLE.USER_ID, USER_ROLE.ROLE)
                .from(USER_ROLE)
                .join(USERS)
                .on(USERS.USER_ID.eq(USER_ROLE.USER_ID))
                .where(current())
                .forEach(row -> held.computeIfAbsent(row.value1(), id -> new ArrayList<>())
                        .add(Role.valueOf(row.value2())));
        return dslContext
                .select(USERS.USER_ID, USERS.NAME, USERS.EMAIL)
                .from(USERS)
                .where(current())
                .orderBy(USERS.NAME, USERS.USER_ID)
                .fetch(row -> new RoleViews.RoleMember(
                        row.value1(),
                        row.value2(),
                        row.value3(),
                        Set.copyOf(held.getOrDefault(row.value1(), List.of()))));
    }

    private static Condition current() {
        return USERS.DELETED_AT.isNull().and(USERS.STATUS.ne(UserStatus.TERMINATED.name()));
    }
}

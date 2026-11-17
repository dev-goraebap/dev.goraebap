package xyz.goraebap.module.foundation.user.infrastructure;

import static org.jooq.impl.DSL.noCondition;
import static xyz.goraebap.jooq.tables.UserRole.USER_ROLE;
import static xyz.goraebap.jooq.tables.Users.USERS;

import java.time.Clock;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Query;
import org.springframework.stereotype.Repository;
import xyz.goraebap.module.foundation.user.domain.role.MemberRoles;
import xyz.goraebap.module.foundation.user.domain.role.RoleRepository;
import xyz.goraebap.shared.web.Role;

@Repository
@RequiredArgsConstructor
class JooqRoleRepository implements RoleRepository {
    private final DSLContext dslContext;
    private final Clock clock;

    public MemberRoles findByUserId(UUID userId) {
        return findAllByUserId(List.of(userId)).getFirst();
    }

    public List<MemberRoles> findAllByUserId(Collection<UUID> userIds) {
        Map<UUID, List<Role>> held = new HashMap<>();
        userIds.forEach(id -> held.put(id, new ArrayList<>()));
        if (userIds.isEmpty()) return List.of();
        dslContext
                .select(USER_ROLE.USER_ID, USER_ROLE.ROLE)
                .from(USER_ROLE)
                .where(USER_ROLE.USER_ID.in(userIds))
                .forEach(row -> held.get(row.value1()).add(Role.valueOf(row.value2())));
        return held.entrySet().stream()
                .map(entry -> MemberRoles.fromPersistence(entry.getKey(), entry.getValue()))
                .toList();
    }

    public boolean existsActiveHolder(Role role) {
        return dslContext.fetchExists(dslContext
                .selectOne()
                .from(USER_ROLE)
                .join(USERS)
                .on(USERS.USER_ID.eq(USER_ROLE.USER_ID))
                .where(USER_ROLE.ROLE.eq(role.name()))
                .and(USERS.IS_ACTIVE.isTrue())
                .and(USERS.DELETED_AT.isNull()));
    }

    public java.util.Set<UUID> findHolders(Role role) {
        return new java.util.HashSet<>(dslContext
                .select(USER_ROLE.USER_ID)
                .from(USER_ROLE)
                .where(USER_ROLE.ROLE.eq(role.name()))
                .fetch(USER_ROLE.USER_ID));
    }

    public void save(MemberRoles memberRoles, UUID actor) {
        saveAll(List.of(memberRoles), actor);
    }

    public void saveAll(List<MemberRoles> memberRoles, UUID actor) {
        var now = clock.instant();
        List<Query> queries = new ArrayList<>();
        for (var member : memberRoles) {
            var names = member.roles().stream().map(Role::name).toList();
            queries.add(dslContext
                    .deleteFrom(USER_ROLE)
                    .where(USER_ROLE.USER_ID.eq(member.userId()))
                    .and(names.isEmpty() ? noCondition() : USER_ROLE.ROLE.notIn(names)));
            for (var name : names)
                queries.add(dslContext
                        .insertInto(USER_ROLE)
                        .set(USER_ROLE.USER_ID, member.userId())
                        .set(USER_ROLE.ROLE, name)
                        .set(USER_ROLE.GRANTED_AT, now)
                        .set(USER_ROLE.GRANTED_BY, actor)
                        .onConflictDoNothing());
        }
        if (!queries.isEmpty()) dslContext.batch(queries).execute();
    }
}

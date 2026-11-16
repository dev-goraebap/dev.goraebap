package xyz.goraebap.foundation.user.infrastructure;

import static org.jooq.impl.DSL.lower;
import static xyz.goraebap.foundation.jooq.tables.UserRole.USER_ROLE;
import static xyz.goraebap.foundation.jooq.tables.Users.USERS;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.foundation.user.UserStatus;
import xyz.goraebap.foundation.user.application.account.UserQuery;
import xyz.goraebap.foundation.shared.web.Role;

@Repository
@RequiredArgsConstructor
class JooqUserQuery implements UserQuery {
    private final DSLContext dslContext;

    public Map<UUID, String> namesOf(Collection<UUID> userIds) {
        if (userIds.isEmpty()) return Map.of();
        return dslContext
                .select(USERS.USER_ID, USERS.NAME)
                .from(USERS)
                .where(USERS.USER_ID.in(userIds))
                .fetchMap(USERS.USER_ID, USERS.NAME);
    }

    public Map<UUID, String> activeNames() {
        return dslContext
                .select(USERS.USER_ID, USERS.NAME)
                .from(USERS)
                .where(USERS.STATUS.eq(UserStatus.ACTIVE.name()))
                .and(USERS.DELETED_AT.isNull())
                .and(USERS.NAME.isNotNull())
                .fetchMap(USERS.USER_ID, USERS.NAME);
    }

    public Optional<String> activeEmail(UUID userId) {
        return dslContext
                .select(USERS.EMAIL)
                .from(USERS)
                .where(USERS.USER_ID.eq(userId))
                .and(USERS.STATUS.eq(UserStatus.ACTIVE.name()))
                .and(USERS.DELETED_AT.isNull())
                .fetchOptional(USERS.EMAIL);
    }

    public Optional<UUID> activeIdByEmail(String email) {
        return dslContext
                .select(USERS.USER_ID)
                .from(USERS)
                .where(lower(USERS.EMAIL).eq(email))
                .and(USERS.STATUS.eq(UserStatus.ACTIVE.name()))
                .and(USERS.DELETED_AT.isNull())
                .limit(1)
                .fetchOptional(USERS.USER_ID);
    }

    public Optional<UUID> firstActive(Role role) {
        var active = USERS.STATUS.eq(UserStatus.ACTIVE.name()).and(USERS.DELETED_AT.isNull());
        return dslContext
                .select(USERS.USER_ID)
                .from(USERS)
                .where(
                        role == null
                                ? active
                                : active.and(USERS.USER_ID.in(dslContext
                                        .select(USER_ROLE.USER_ID)
                                        .from(USER_ROLE)
                                        .where(USER_ROLE.ROLE.eq(role.name())))))
                .orderBy(USERS.INVITED_AT.asc().nullsLast(), USERS.USER_ID.asc())
                .limit(1)
                .fetchOptional(USERS.USER_ID);
    }
}

package xyz.goraebap.module.foundation.user.infrastructure;

import static org.jooq.impl.DSL.lower;
import static xyz.goraebap.jooq.tables.UserRole.USER_ROLE;
import static xyz.goraebap.jooq.tables.Users.USERS;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Record4;
import org.jooq.SelectConditionStep;
import org.springframework.stereotype.Repository;
import xyz.goraebap.module.foundation.user.domain.identity.Identity;
import xyz.goraebap.module.foundation.user.domain.identity.IdentityRepository;
import xyz.goraebap.shared.web.Role;

@Repository
@RequiredArgsConstructor
class JooqIdentityRepository implements IdentityRepository {
    private final DSLContext dslContext;

    public Optional<Identity> findActiveByEmailForUpdate(String email) {
        return active().and(lower(USERS.EMAIL).eq(email)).fetchOptional(this::identity);
    }

    public Optional<Identity> findActiveById(UUID id) {
        return active().and(USERS.USER_ID.eq(id)).fetchOptional(this::identity);
    }

    // Sign-in depends on loginAllowed alone, which follows the member starting work and leaving.
    private SelectConditionStep<Record4<UUID, String, String, Instant>> active() {
        return dslContext
                .select(USERS.USER_ID, USERS.EMAIL, USERS.NAME, USERS.ONBOARDED_AT)
                .from(USERS)
                .where(USERS.IS_ACTIVE.isTrue())
                .and(USERS.DELETED_AT.isNull());
    }

    private Identity identity(Record4<UUID, String, String, Instant> row) {
        return new Identity(row.value1(), row.value2(), row.value3(), rolesOf(row.value1()), row.value4() != null);
    }

    private Set<Role> rolesOf(UUID userId) {
        return dslContext
                .select(USER_ROLE.ROLE)
                .from(USER_ROLE)
                .where(USER_ROLE.USER_ID.eq(userId))
                .fetch(USER_ROLE.ROLE)
                .stream()
                .map(Role::valueOf)
                .collect(Collectors.toUnmodifiableSet());
    }
}

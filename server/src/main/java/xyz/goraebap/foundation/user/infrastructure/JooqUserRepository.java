package xyz.goraebap.foundation.user.infrastructure;

import static org.jooq.impl.DSL.excluded;
import static org.jooq.impl.DSL.lower;
import static xyz.goraebap.jooq.tables.IamPermissionLock.IAM_PERMISSION_LOCK;
import static xyz.goraebap.jooq.tables.Users.USERS;

import java.time.Clock;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Query;
import org.springframework.stereotype.Repository;
import xyz.goraebap.foundation.user.Gender;
import xyz.goraebap.foundation.user.UserStatus;
import xyz.goraebap.foundation.user.domain.user.User;
import xyz.goraebap.foundation.user.domain.user.UserRepository;
import xyz.goraebap.jooq.tables.records.UsersRecord;

@Repository
@RequiredArgsConstructor
class JooqUserRepository implements UserRepository {
    private final DSLContext dslContext;
    private final Clock clock;

    public Optional<User> findById(UUID id) {
        return dslContext
                .selectFrom(USERS)
                .where(USERS.USER_ID.eq(id))
                .and(USERS.DELETED_AT.isNull())
                .fetchOptional(this::user);
    }

    public void lockAdminChanges() {
        dslContext
                .select(IAM_PERMISSION_LOCK.ID)
                .from(IAM_PERMISSION_LOCK)
                .where(IAM_PERMISSION_LOCK.ID.eq(1))
                .fetchOne();
    }

    public Map<String, UUID> findActiveIdsByEmail(Collection<String> emails) {
        Map<String, UUID> ids = new HashMap<>();
        if (emails.isEmpty()) return ids;
        dslContext
                .select(USERS.EMAIL, USERS.USER_ID)
                .from(USERS)
                .where(lower(USERS.EMAIL).in(emails))
                .and(USERS.IS_ACTIVE.isTrue())
                .and(USERS.DELETED_AT.isNull())
                .forEach(row -> ids.put(row.value1().toLowerCase(Locale.ROOT), row.value2()));
        return ids;
    }

    public boolean anyExists() {
        return dslContext.fetchExists(USERS);
    }

    public Optional<User> findByIdForUpdate(UUID id) {
        return findById(id);
    }

    public Optional<UserStatus> statusOfEmailOwner(String email, UUID exceptId) {
        return dslContext
                .select(USERS.STATUS)
                .from(USERS)
                .where(lower(USERS.EMAIL).eq(email))
                .and(USERS.USER_ID.ne(exceptId))
                .limit(1)
                .fetchOptional(row -> UserStatus.valueOf(row.value1()));
    }

    public Map<String, UserStatus> statusesByEmail(Collection<String> emails) {
        Map<String, UserStatus> owners = new HashMap<>();
        if (emails.isEmpty()) return owners;
        dslContext
                .select(USERS.EMAIL, USERS.STATUS)
                .from(USERS)
                .where(lower(USERS.EMAIL).in(emails))
                .forEach(row -> owners.put(row.value1().toLowerCase(Locale.ROOT), UserStatus.valueOf(row.value2())));
        return owners;
    }

    public void save(User user, UUID actor) {
        saveAll(List.of(user), actor);
    }

    public void saveAll(List<User> users, UUID actor) {
        var now = clock.instant();
        List<Query> upserts = users.stream()
                .<Query>map(user -> dslContext
                        .insertInto(USERS)
                        .set(USERS.USER_ID, user.id())
                        .set(USERS.NAME, user.name())
                        .set(USERS.EMAIL, user.email())
                        .set(
                                USERS.GENDER,
                                user.gender() == null ? null : user.gender().name())
                        .set(USERS.STATUS, user.status().name())
                        .set(USERS.INVITED_AT, user.invitedAt())
                        .set(USERS.ACTIVATED_AT, user.activatedAt())
                        .set(USERS.TERMINATED_AT, user.terminatedAt())
                        .set(USERS.IS_ACTIVE, user.loginAllowed())
                        .set(USERS.ONBOARDED_AT, user.onboardedAt())
                        .set(USERS.CREATED_BY, actor)
                        .set(USERS.UPDATED_BY, actor)
                        .set(USERS.CREATED_AT, now)
                        .set(USERS.UPDATED_AT, now)
                        .onConflict(USERS.USER_ID)
                        .doUpdate()
                        .set(USERS.NAME, excluded(USERS.NAME))
                        .set(USERS.EMAIL, excluded(USERS.EMAIL))
                        .set(USERS.GENDER, excluded(USERS.GENDER))
                        .set(USERS.STATUS, excluded(USERS.STATUS))
                        .set(USERS.ACTIVATED_AT, excluded(USERS.ACTIVATED_AT))
                        .set(USERS.TERMINATED_AT, excluded(USERS.TERMINATED_AT))
                        .set(USERS.IS_ACTIVE, excluded(USERS.IS_ACTIVE))
                        .set(USERS.ONBOARDED_AT, excluded(USERS.ONBOARDED_AT))
                        .set(USERS.UPDATED_BY, excluded(USERS.UPDATED_BY))
                        .set(USERS.UPDATED_AT, excluded(USERS.UPDATED_AT)))
                .toList();
        dslContext.batch(upserts).execute();
    }

    private User user(UsersRecord row) {
        return User.fromPersistence(
                row.getUserId(),
                row.getName(),
                row.getEmail(),
                row.getGender() == null ? null : Gender.valueOf(row.getGender()),
                UserStatus.valueOf(row.getStatus()),
                row.getInvitedAt(),
                row.getActivatedAt(),
                row.getTerminatedAt(),
                row.getIsActive(),
                row.getOnboardedAt());
    }
}

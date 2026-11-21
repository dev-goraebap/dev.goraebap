package xyz.goraebap.cowork.module.user.infrastructure;

import static xyz.goraebap.cowork.jooq.tables.Users.USERS;

import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.cowork.module.user.domain.avatar.Avatar;
import xyz.goraebap.cowork.module.user.domain.avatar.AvatarRepository;

/** The avatar lives on the member's row. */
@Repository
@RequiredArgsConstructor
class JooqAvatarRepository implements AvatarRepository {
    private final DSLContext dslContext;

    public Avatar find(UUID employeeId) {
        return dslContext
                .select(USERS.AVATAR_PRESET, USERS.AVATAR_PICTURE_ID)
                .from(USERS)
                .where(USERS.USER_ID.eq(employeeId))
                .fetchOptional(row -> Avatar.fromPersistence(
                        employeeId, row.value1() == null ? null : row.value1().intValue(), row.value2()))
                .orElseGet(() -> Avatar.derived(employeeId));
    }

    public void save(Avatar avatar, Instant now) {
        Short preset = avatar.preset() == null ? null : avatar.preset().shortValue();
        dslContext
                .update(USERS)
                .set(USERS.AVATAR_PRESET, preset)
                .set(USERS.AVATAR_PICTURE_ID, avatar.pictureId())
                .set(USERS.UPDATED_AT, now)
                .where(USERS.USER_ID.eq(avatar.employeeId()))
                .execute();
    }
}

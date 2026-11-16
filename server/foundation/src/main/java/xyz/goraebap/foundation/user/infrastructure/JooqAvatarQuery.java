package xyz.goraebap.foundation.user.infrastructure;

import static xyz.goraebap.foundation.jooq.tables.Users.USERS;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.foundation.user.application.avatar.AvatarQuery;
import xyz.goraebap.foundation.user.application.avatar.AvatarViews;

@Repository
@RequiredArgsConstructor
class JooqAvatarQuery implements AvatarQuery {
    private final DSLContext dslContext;

    @Override
    public List<AvatarViews.AvatarItem> findAllChosen() {
        return dslContext
                .select(USERS.USER_ID, USERS.AVATAR_PRESET, USERS.AVATAR_PICTURE_ID)
                .from(USERS)
                .where(USERS.AVATAR_PRESET.isNotNull().or(USERS.AVATAR_PICTURE_ID.isNotNull()))
                .orderBy(USERS.USER_ID)
                .fetch(row -> new AvatarViews.AvatarItem(
                        row.value1(), row.value2() == null ? null : row.value2().intValue(), row.value3(), null));
    }
}

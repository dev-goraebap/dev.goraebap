package xyz.goraebap.module.foundation.user.infrastructure;

import static org.jooq.Records.mapping;
import static xyz.goraebap.jooq.tables.Users.USERS;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.module.foundation.user.application.account.AccountQuery;
import xyz.goraebap.module.foundation.user.application.auth.AuthViews;

@Repository
@RequiredArgsConstructor
class JooqAccountQuery implements AccountQuery {
    private final DSLContext dslContext;

    public List<AuthViews.Member> loginAllowed() {
        return dslContext
                .select(USERS.USER_ID, USERS.NAME, USERS.EMAIL)
                .from(USERS)
                .where(USERS.IS_ACTIVE.isTrue())
                .and(USERS.DELETED_AT.isNull())
                .orderBy(USERS.NAME, USERS.USER_ID)
                .limit(500)
                .fetch(mapping(AuthViews.Member::new));
    }
}

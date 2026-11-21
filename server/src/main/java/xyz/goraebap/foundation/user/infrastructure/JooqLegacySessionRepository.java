package xyz.goraebap.foundation.user.infrastructure;

import static xyz.goraebap.jooq.tables.RefreshToken.REFRESH_TOKEN;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.foundation.user.domain.session.LegacySessionRepository;

/** The old app's refresh_token table as the legacy import copied it; using a token marks it revoked. */
@Repository
@RequiredArgsConstructor
class JooqLegacySessionRepository implements LegacySessionRepository {
    private final DSLContext dslContext;

    public Optional<UUID> consume(String hash, Instant now) {
        // One conditional update: of two requests with the same token, only the first changes the row.
        int used = dslContext
                .update(REFRESH_TOKEN)
                .set(REFRESH_TOKEN.REVOKED_AT, now)
                .where(REFRESH_TOKEN.TOKEN_HASH.eq(hash))
                .and(REFRESH_TOKEN.REVOKED_AT.isNull())
                .and(REFRESH_TOKEN.ROTATED_TO_ID.isNull())
                .and(REFRESH_TOKEN.EXPIRES_AT.gt(now))
                .execute();
        if (used == 0) return Optional.empty();
        return dslContext
                .select(REFRESH_TOKEN.USER_ACCOUNT_ID)
                .from(REFRESH_TOKEN)
                .where(REFRESH_TOKEN.TOKEN_HASH.eq(hash))
                .fetchOptional(REFRESH_TOKEN.USER_ACCOUNT_ID);
    }
}

package xyz.goraebap.cowork.module.user.infrastructure;

import static org.jooq.impl.DSL.excluded;
import static xyz.goraebap.cowork.jooq.tables.IamSession.IAM_SESSION;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.cowork.module.user.domain.session.LoginSession;
import xyz.goraebap.cowork.module.user.domain.session.SessionRepository;

@Repository
@RequiredArgsConstructor
class JooqSessionRepository implements SessionRepository {
    private final DSLContext dslContext;

    public Optional<LoginSession> findByHashForUpdate(String hash) {
        return dslContext
                .selectFrom(IAM_SESSION)
                .where(IAM_SESSION.TOKEN_HASH.eq(hash))
                .fetchOptional()
                .map(row -> LoginSession.fromPersistence(
                        row.getTokenHash(),
                        row.getUserAccountId(),
                        row.getCreatedAt(),
                        row.getTouchedAt(),
                        row.getExpiresAt()));
    }

    public void save(LoginSession session) {
        dslContext
                .insertInto(IAM_SESSION)
                .set(IAM_SESSION.TOKEN_HASH, session.hash())
                .set(IAM_SESSION.USER_ACCOUNT_ID, session.userId())
                .set(IAM_SESSION.CREATED_AT, session.createdAt())
                .set(IAM_SESSION.TOUCHED_AT, session.touchedAt())
                .set(IAM_SESSION.EXPIRES_AT, session.expiresAt())
                .onConflict(IAM_SESSION.TOKEN_HASH)
                .doUpdate()
                .set(IAM_SESSION.TOUCHED_AT, excluded(IAM_SESSION.TOUCHED_AT))
                .set(IAM_SESSION.EXPIRES_AT, excluded(IAM_SESSION.EXPIRES_AT))
                .execute();
    }

    public void touch(String hash, Instant touchedAt, Instant expiresAt) {
        dslContext
                .update(IAM_SESSION)
                .set(IAM_SESSION.TOUCHED_AT, touchedAt)
                .set(IAM_SESSION.EXPIRES_AT, expiresAt)
                .where(IAM_SESSION.TOKEN_HASH.eq(hash))
                .execute();
    }

    public void deleteByHash(String hash) {
        dslContext
                .deleteFrom(IAM_SESSION)
                .where(IAM_SESSION.TOKEN_HASH.eq(hash))
                .execute();
    }

    public void deleteAllByUserId(UUID userId) {
        dslContext
                .deleteFrom(IAM_SESSION)
                .where(IAM_SESSION.USER_ACCOUNT_ID.eq(userId))
                .execute();
    }
}

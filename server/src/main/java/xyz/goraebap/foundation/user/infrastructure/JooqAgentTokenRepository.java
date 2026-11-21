package xyz.goraebap.foundation.user.infrastructure;

import static org.jooq.impl.DSL.excluded;
import static xyz.goraebap.jooq.tables.AgentToken.AGENT_TOKEN;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.foundation.user.domain.agenttoken.AgentToken;
import xyz.goraebap.foundation.user.domain.agenttoken.AgentTokenRepository;
import xyz.goraebap.jooq.tables.records.AgentTokenRecord;

@Repository
@RequiredArgsConstructor
class JooqAgentTokenRepository implements AgentTokenRepository {
    private final DSLContext dslContext;

    public Optional<AgentToken> findById(UUID id) {
        return dslContext
                .selectFrom(AGENT_TOKEN)
                .where(AGENT_TOKEN.TOKEN_ID.eq(id))
                .fetchOptional()
                .map(JooqAgentTokenRepository::token);
    }

    @Override
    public Optional<AgentToken> findByProfileId(UUID profileId) {
        return dslContext
                .selectFrom(AGENT_TOKEN)
                .where(AGENT_TOKEN.PROFILE_ID.eq(profileId))
                .fetchOptional()
                .map(JooqAgentTokenRepository::token);
    }

    public Optional<AgentToken> findByHash(String hash) {
        return dslContext
                .selectFrom(AGENT_TOKEN)
                .where(AGENT_TOKEN.TOKEN_HASH.eq(hash))
                .fetchOptional()
                .map(JooqAgentTokenRepository::token);
    }

    public List<AgentToken> findAllLiveByUserId(UUID userId) {
        return dslContext
                .selectFrom(AGENT_TOKEN)
                .where(AGENT_TOKEN.USER_ID.eq(userId))
                .and(AGENT_TOKEN.REVOKED_AT.isNull())
                .orderBy(AGENT_TOKEN.CREATED_AT.desc(), AGENT_TOKEN.TOKEN_ID.desc())
                .fetch(JooqAgentTokenRepository::token);
    }

    public void save(AgentToken token) {
        dslContext
                .insertInto(AGENT_TOKEN)
                .set(AGENT_TOKEN.TOKEN_ID, token.id())
                .set(AGENT_TOKEN.USER_ID, token.userId())
                .set(AGENT_TOKEN.PROFILE_ID, token.profileId())
                .set(AGENT_TOKEN.NAME, token.name())
                .set(AGENT_TOKEN.AGENT_NAME, token.agentName())
                .set(AGENT_TOKEN.PREFIX, token.prefix())
                .set(AGENT_TOKEN.TOKEN_HASH, token.hash())
                .set(AGENT_TOKEN.CREATED_AT, token.createdAt())
                .set(AGENT_TOKEN.EXPIRES_AT, token.expiresAt())
                .set(AGENT_TOKEN.LAST_USED_AT, token.lastUsedAt())
                .set(AGENT_TOKEN.LAST_USED_IP, token.lastUsedIp())
                .set(AGENT_TOKEN.REVOKED_AT, token.revokedAt())
                .onConflict(AGENT_TOKEN.TOKEN_ID)
                .doUpdate()
                .set(AGENT_TOKEN.LAST_USED_AT, excluded(AGENT_TOKEN.LAST_USED_AT))
                .set(AGENT_TOKEN.LAST_USED_IP, excluded(AGENT_TOKEN.LAST_USED_IP))
                .set(AGENT_TOKEN.REVOKED_AT, excluded(AGENT_TOKEN.REVOKED_AT))
                .execute();
    }

    public void revokeAllByUserId(UUID userId, Instant now) {
        dslContext
                .update(AGENT_TOKEN)
                .set(AGENT_TOKEN.REVOKED_AT, now)
                .where(AGENT_TOKEN.USER_ID.eq(userId))
                .and(AGENT_TOKEN.REVOKED_AT.isNull())
                .execute();
    }

    private static AgentToken token(AgentTokenRecord row) {
        return AgentToken.fromPersistence(
                row.getTokenId(),
                row.getUserId(),
                row.getProfileId(),
                row.getName(),
                row.getAgentName(),
                row.getPrefix(),
                row.getTokenHash(),
                row.getCreatedAt(),
                row.getExpiresAt(),
                row.getLastUsedAt(),
                row.getLastUsedIp(),
                row.getRevokedAt());
    }
}

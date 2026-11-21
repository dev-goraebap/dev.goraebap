package xyz.goraebap.cowork.module.user.domain.agenttoken;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgentTokenRepository {
    Optional<AgentToken> findById(UUID id);

    Optional<AgentToken> findByProfileId(UUID profileId);

    Optional<AgentToken> findByHash(String hash);

    /** The member's tokens that are not revoked, newest first. */
    List<AgentToken> findAllLiveByUserId(UUID userId);

    void save(AgentToken token);

    /** Revokes every token of the member still working, as when they leave. */
    void revokeAllByUserId(UUID userId, Instant now);
}

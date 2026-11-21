package xyz.goraebap.cowork.module.user.domain.session;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface SessionRepository {
    Optional<LoginSession> findByHashForUpdate(String hash);

    void save(LoginSession session);

    /** Moves a stored session's last use and expiry; a session deleted meanwhile stays deleted. */
    void touch(String hash, Instant touchedAt, Instant expiresAt);

    void deleteByHash(String hash);

    void deleteAllByUserId(UUID userId);
}

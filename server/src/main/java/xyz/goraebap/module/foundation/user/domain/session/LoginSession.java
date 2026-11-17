package xyz.goraebap.module.foundation.user.domain.session;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;

@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(staticName = "fromPersistence")
public class LoginSession {
    @EqualsAndHashCode.Include
    private final String hash;

    private final UUID userId;
    private final Instant createdAt;
    private Instant touchedAt;
    private Instant expiresAt;

    public static LoginSession create(String hash, UUID userId, Instant now, Instant expiresAt) {
        return new LoginSession(hash, userId, now, now, expiresAt);
    }

    public boolean expired(Instant now, Duration absoluteTtl) {
        return !now.isBefore(expiresAt) || !now.isBefore(createdAt.plus(absoluteTtl));
    }

    public void touch(Instant now, Duration ttl, Duration absoluteTtl) {
        Instant expiry = now.plus(ttl);
        Instant limit = createdAt.plus(absoluteTtl);
        this.touchedAt = now;
        this.expiresAt = expiry.isBefore(limit) ? expiry : limit;
    }
}

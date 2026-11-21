package xyz.goraebap.foundation.user.domain.session;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/** The old cowork-hr app's refresh tokens, moved with its data so a member signed in there stays signed in once. */
public interface LegacySessionRepository {
    /**
     * Uses up the token with this hash and returns its account, when it is the latest of its chain, was never revoked
     * and has not expired at {@code now}. Any later call with the same hash finds nothing.
     */
    Optional<UUID> consume(String hash, Instant now);
}

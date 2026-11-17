package xyz.goraebap.module.foundation.user.domain.otp;

import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;

/** One outstanding sign-in code per user; issuing a new one replaces it. */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(staticName = "fromPersistence")
public class Otp {
    @EqualsAndHashCode.Include
    private final UUID userId;

    private final String hash;
    private final Instant issuedAt;
    private final Instant expiresAt;
    private int attempts;
    private boolean consumed;

    public static Otp create(UUID userId, String hash, Instant issuedAt, Instant expiresAt) {
        return new Otp(userId, hash, issuedAt, expiresAt, 0, false);
    }

    public boolean usable(Instant now, int maximum) {
        return !consumed && now.isBefore(expiresAt) && attempts < maximum;
    }

    public void attempt(boolean matches) {
        attempts++;
        if (matches) consumed = true;
    }
}

package xyz.goraebap.module.foundation.user.domain.otp;

import java.util.Optional;
import java.util.UUID;

public interface OtpRepository {
    Optional<Otp> findByUserIdForUpdate(UUID userId);

    void save(Otp otp);

    /** Takes back a code that could not be sent, unless a newer one has replaced it. */
    void discard(Otp otp);
}

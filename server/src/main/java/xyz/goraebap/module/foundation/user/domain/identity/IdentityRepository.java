package xyz.goraebap.module.foundation.user.domain.identity;

import java.util.Optional;
import java.util.UUID;

public interface IdentityRepository {
    Optional<Identity> findActiveByEmailForUpdate(String email);

    Optional<Identity> findActiveById(UUID id);
}

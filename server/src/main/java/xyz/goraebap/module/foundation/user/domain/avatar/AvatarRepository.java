package xyz.goraebap.module.foundation.user.domain.avatar;

import java.time.Instant;
import java.util.UUID;

public interface AvatarRepository {
    /** The member's avatar, derived from the id when they have chosen nothing. */
    Avatar find(UUID userId);

    void save(Avatar avatar, Instant now);
}

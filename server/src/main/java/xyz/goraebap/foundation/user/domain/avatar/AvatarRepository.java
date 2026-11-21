package xyz.goraebap.foundation.user.domain.avatar;

import java.time.Instant;
import java.util.UUID;

public interface AvatarRepository {
    /** The employee's avatar, derived from the id when they have chosen nothing. */
    Avatar find(UUID employeeId);

    void save(Avatar avatar, Instant now);
}

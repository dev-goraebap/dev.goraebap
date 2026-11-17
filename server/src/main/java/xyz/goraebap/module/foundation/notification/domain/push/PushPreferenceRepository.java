package xyz.goraebap.module.foundation.notification.domain.push;

import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public interface PushPreferenceRepository {
    /** The groups each of the members turned off; a member who turned none off is left out. */
    Map<UUID, Set<PushTopic>> findMutedByUserIdIn(Collection<UUID> userIds);

    /** Replaces the groups the member turned off. */
    void saveMuted(UUID userId, Set<PushTopic> muted);
}

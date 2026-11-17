package xyz.goraebap.module.foundation.notification.domain.push;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PushSubscriptionRepository {
    Optional<PushSubscription> findById(UUID id);

    /** The subscription of this browser, whoever it belongs to, read under the write lock while it is renewed. */
    Optional<PushSubscription> findByEndpointForUpdate(String endpoint);

    /** The subscriptions still taking pushes of each of the members. */
    List<PushSubscription> findAllActiveByUserIdIn(Collection<UUID> userIds);

    List<PushSubscription> findAllById(Collection<UUID> ids);

    void save(PushSubscription subscription);
}

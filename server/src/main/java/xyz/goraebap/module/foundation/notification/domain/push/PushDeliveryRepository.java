package xyz.goraebap.module.foundation.notification.domain.push;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface PushDeliveryRepository {
    /**
     * Up to limit pushes whose turn has come by the moment (PushDelivery.isDue), oldest first, read under the
     * database's write lock so that no other sender takes them before this transaction ends.
     */
    List<PushDelivery> findAllDueForUpdate(Instant now, int limit);

    void saveAll(Collection<PushDelivery> deliveries);

    /** Drops the record of pushes made before the moment. */
    int deleteByCreatedAtBefore(Instant moment);
}

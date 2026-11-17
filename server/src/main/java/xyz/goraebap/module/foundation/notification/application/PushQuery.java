package xyz.goraebap.module.foundation.notification.application;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PushQuery {
    /** The member's devices still taking pushes, the latest first, each with how its last push went. */
    List<PushViews.PushDevice> activeDevicesOf(UUID userId);

    /** Every device the member ever had, the latest first, up to limit. */
    List<PushViews.PushDevice> devicesOf(UUID userId, int limit);

    /** The member's latest pushes, up to limit. */
    List<PushViews.PushDeliveryRow> deliveriesOf(UUID userId, int limit);

    /** Every kind of notice ever sent, with counts since the moment and its latest notice. */
    List<PushViews.NoticeKindRow> kinds(Instant since);

    /** Company-wide counts of pushes made since the moment, and of devices and working members now. */
    PushViews.PushSummary summary(Instant since, boolean configured);

    /** Working members by name matching the listing, with their devices and pushes since the moment; names left blank. */
    List<PushViews.PushMemberRow> members(PushRequests.PushMemberListing listing, Instant since);

    /** Whether the member exists and is not deleted. */
    Optional<UUID> findUser(UUID userId);
}

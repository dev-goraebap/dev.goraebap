package xyz.goraebap.foundation.notification.application;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import xyz.goraebap.foundation.notification.Notice;
import xyz.goraebap.foundation.notification.domain.push.PushDelivery;
import xyz.goraebap.foundation.notification.domain.push.PushDeliveryRepository;
import xyz.goraebap.foundation.notification.domain.push.PushPreferenceRepository;
import xyz.goraebap.foundation.notification.domain.push.PushSubscription;
import xyz.goraebap.foundation.notification.domain.push.PushSubscriptionRepository;
import xyz.goraebap.foundation.notification.domain.push.PushTopic;
import xyz.goraebap.foundation.realtime.RealtimeFacade;
import xyz.goraebap.foundation.realtime.Signal;

/**
 * Queues the pushes a notice asks for inside the notice's own transaction, so they exist exactly when it does: one
 * waiting push for each device of each recipient, or a record of why none went (no device, the group turned off).
 * The dispatcher sends them once the transaction commits. The member's and administrators' screens hear of it (a PUSH
 * signal) so they show the pushes as on their way. With no VAPID key nothing is queued.
 */
@Component
@RequiredArgsConstructor
class PushOutbox {
    private final PushGateway pushGateway;
    private final PushSubscriptionRepository subscriptions;
    private final PushPreferenceRepository preferences;
    private final PushDeliveryRepository deliveries;
    private final ApplicationEventPublisher events;
    private final RealtimeFacade realtimeFacade;

    void queue(UUID eventId, Notice notice, Instant now) {
        if (!pushGateway.isConfigured() || notice.recipients().isEmpty()) return;
        var topic = PushTopic.of(notice.kind());
        var muted = preferences.findMutedByUserIdIn(notice.recipients());
        var devices = subscriptions.findAllActiveByUserIdIn(notice.recipients()).stream()
                .collect(Collectors.groupingBy(PushSubscription::userId));
        List<PushDelivery> queued = new ArrayList<>();
        for (var recipient : notice.recipients()) {
            if (topic.isPresent() && muted.getOrDefault(recipient, Set.of()).contains(topic.get()))
                queued.add(PushDelivery.skipped(
                        UUID.randomUUID(),
                        eventId,
                        recipient,
                        notice.title(),
                        notice.link(),
                        PushDelivery.Status.MUTED,
                        now));
            else if (!devices.containsKey(recipient))
                queued.add(PushDelivery.skipped(
                        UUID.randomUUID(),
                        eventId,
                        recipient,
                        notice.title(),
                        notice.link(),
                        PushDelivery.Status.NO_DEVICE,
                        now));
            else
                for (var device : devices.get(recipient))
                    queued.add(PushDelivery.pending(
                            UUID.randomUUID(), eventId, recipient, device.id(), notice.title(), notice.link(), now));
        }
        deliveries.saveAll(queued);
        realtimeFacade.signal(
                Signal.to(Signal.Topic.PUSH, eventId, notice.recipients()).andAdministrators());
        if (queued.stream().anyMatch(delivery -> delivery.status() == PushDelivery.Status.PENDING))
            events.publishEvent(new PushQueued());
    }

    /** A test push to each of the given devices, with no notice behind it. */
    void queueTest(UUID recipient, List<PushSubscription> devices, String title, String link, Instant now) {
        deliveries.saveAll(devices.stream()
                .map(device -> PushDelivery.pending(UUID.randomUUID(), null, recipient, device.id(), title, link, now))
                .toList());
        realtimeFacade.signal(
                Signal.to(Signal.Topic.PUSH, recipient, List.of(recipient)).andAdministrators());
        if (!devices.isEmpty()) events.publishEvent(new PushQueued());
    }
}

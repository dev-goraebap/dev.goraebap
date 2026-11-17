package xyz.goraebap.module.foundation.notification.application;

import java.time.Clock;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.module.foundation.notification.domain.push.PushPreferenceRepository;
import xyz.goraebap.module.foundation.notification.domain.push.PushSubscription;
import xyz.goraebap.module.foundation.notification.domain.push.PushSubscriptionRepository;
import xyz.goraebap.module.foundation.notification.domain.push.PushTopic;
import xyz.goraebap.module.foundation.realtime.RealtimeFacade;
import xyz.goraebap.module.foundation.realtime.Signal;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * A member's browser push: whether this server pushes and with which key, the member's devices (a browser subscribes
 * or is renewed by its endpoint, and the member ends one), which groups of notices they take as a push, and a test
 * push to their devices. In-app notices stay whatever is chosen here.
 */
@Service
@RequiredArgsConstructor
public class PushService {
    static final String TEST_TITLE = "테스트 알림이에요. 이 기기에서 알림을 받을 수 있습니다.";
    static final String TEST_LINK = "/settings";

    private final PushGateway pushGateway;
    private final PushSubscriptionRepository subscriptions;
    private final PushPreferenceRepository preferences;
    private final PushQuery pushQuery;
    private final PushOutbox pushOutbox;
    private final RealtimeFacade realtimeFacade;
    private final Clock clock;

    @Transactional(readOnly = true)
    public PushViews.PushConfig config() {
        return new PushViews.PushConfig(pushGateway.isConfigured(), pushGateway.publicKey());
    }

    @Transactional(readOnly = true)
    public List<PushViews.PushDevice> devices(CurrentUser user) {
        return pushQuery.activeDevicesOf(user.id());
    }

    /**
     * Takes this browser's subscription for the member: a browser seen before (by its endpoint) is renewed, even when
     * it was someone else's or had ended, since the browser is the member's now; a new one is added.
     */
    @Transactional
    public PushViews.PushDevice subscribe(CurrentUser user, PushRequests.PushSubscribe request) {
        if (!pushGateway.isConfigured()) throw NotificationErrorCode.PUSH_NOT_CONFIGURED.raise();
        var now = clock.instant();
        var subscription = subscriptions
                .findByEndpointForUpdate(request.endpoint().strip())
                .map(known -> known.renewedFor(
                        user.id(), request.p256dh(), request.auth(), request.userAgent(), request.deviceName(), now))
                .orElseGet(() -> PushSubscription.create(
                        UUID.randomUUID(),
                        user.id(),
                        request.endpoint(),
                        request.p256dh(),
                        request.auth(),
                        request.userAgent(),
                        request.deviceName(),
                        now));
        subscriptions.save(subscription);
        realtimeFacade.signal(Signal.to(Signal.Topic.PUSH, subscription.id(), Set.of(user.id()))
                .andAdministrators());
        return pushQuery.activeDevicesOf(user.id()).stream()
                .filter(device -> device.id().equals(subscription.id()))
                .findFirst()
                .orElseThrow();
    }

    /** Ends one of the member's devices; it keeps its history for administrators. */
    @Transactional
    public void remove(CurrentUser user, UUID id) {
        var subscription = subscriptions
                .findById(id)
                .filter(found -> found.userId().equals(user.id()))
                .orElseThrow(NotificationErrorCode.PUSH_DEVICE_NOT_FOUND::raise);
        subscriptions.save(subscription.ended(clock.instant()));
        realtimeFacade.signal(
                Signal.to(Signal.Topic.PUSH, id, Set.of(user.id())).andAdministrators());
    }

    @Transactional(readOnly = true)
    public PushViews.PushPreferences preferences(CurrentUser user) {
        var muted = preferences.findMutedByUserIdIn(Set.of(user.id())).getOrDefault(user.id(), Set.of());
        return new PushViews.PushPreferences(Arrays.stream(PushTopic.values())
                .map(topic -> new PushViews.PushTopicSetting(topic, !muted.contains(topic)))
                .toList());
    }

    @Transactional
    public PushViews.PushPreferences updatePreferences(CurrentUser user, PushRequests.PushPreferencesChange request) {
        var muted = request.mutedTopics().isEmpty()
                ? EnumSet.noneOf(PushTopic.class)
                : EnumSet.copyOf(request.mutedTopics());
        preferences.saveMuted(user.id(), muted);
        return preferences(user);
    }

    /** Pushes a test to one of the member's devices, or to all of them; how it went shows on each device shortly. */
    @Transactional
    public PushViews.PushTestQueued test(CurrentUser user, PushRequests.PushTestRequest request) {
        if (!pushGateway.isConfigured()) throw NotificationErrorCode.PUSH_NOT_CONFIGURED.raise();
        var devices = subscriptions.findAllActiveByUserIdIn(Set.of(user.id())).stream()
                .filter(device ->
                        request.subscriptionId() == null || device.id().equals(request.subscriptionId()))
                .toList();
        if (devices.isEmpty()) throw NotificationErrorCode.PUSH_NO_DEVICE.raise();
        pushOutbox.queueTest(user.id(), devices, TEST_TITLE, TEST_LINK, clock.instant());
        return new PushViews.PushTestQueued(devices.size());
    }
}

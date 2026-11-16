package xyz.goraebap.foundation.notification.application;

import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.foundation.notification.domain.push.PushSubscriptionRepository;
import xyz.goraebap.foundation.user.UserFacade;

/**
 * How pushing goes, for administrators: the last seven days across the company, each working member's devices and
 * pushes, one member's history in full, and a test push to a member's devices to check them.
 */
@Service
@RequiredArgsConstructor
public class PushAdminService {
    private static final Duration RECENT = Duration.ofDays(7);
    private static final Duration KINDS_RECENT = Duration.ofDays(30);
    private static final int DEVICES_SHOWN = 20;
    private static final int DELIVERIES_SHOWN = 50;

    private final PushGateway pushGateway;
    private final PushQuery pushQuery;
    private final PushSubscriptionRepository subscriptions;
    private final PushOutbox pushOutbox;
    private final UserFacade userFacade;
    private final Clock clock;

    @Transactional(readOnly = true)
    public PushViews.PushSummary summary() {
        return pushQuery.summary(clock.instant().minus(RECENT), pushGateway.isConfigured());
    }

    /** Every kind of notice sent so far, counted over the last thirty days, with its latest notice. */
    @Transactional(readOnly = true)
    public List<PushViews.NoticeKindRow> kinds() {
        return pushQuery.kinds(clock.instant().minus(KINDS_RECENT));
    }

    @Transactional(readOnly = true)
    public List<PushViews.PushMemberRow> members(PushRequests.PushMemberListing listing) {
        var rows = pushQuery.members(listing, clock.instant().minus(RECENT));
        var people = userFacade.summariesOf(
                rows.stream().map(PushViews.PushMemberRow::id).toList());
        return rows.stream()
                .map(row -> {
                    var person = people.get(row.id());
                    return new PushViews.PushMemberRow(
                            row.id(),
                            person == null ? row.name() : person.name(),
                            person == null ? null : person.affiliationName(),
                            row.devices(),
                            row.lastPushAt(),
                            row.lastStatus(),
                            row.sent(),
                            row.failed(),
                            row.noDevice());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public PushViews.PushMemberDetail member(UUID userId) {
        pushQuery.findUser(userId).orElseThrow(NotificationErrorCode.PUSH_MEMBER_NOT_FOUND::raise);
        var person = userFacade.summariesOf(Set.of(userId)).get(userId);
        return new PushViews.PushMemberDetail(
                userId,
                person == null ? null : person.name(),
                person == null ? null : person.affiliationName(),
                pushQuery.devicesOf(userId, DEVICES_SHOWN),
                pushQuery.deliveriesOf(userId, DELIVERIES_SHOWN));
    }

    /** A test push to every device of the member's, to see whether they get pushes. */
    @Transactional
    public PushViews.PushTestQueued test(UUID userId) {
        if (!pushGateway.isConfigured()) throw NotificationErrorCode.PUSH_NOT_CONFIGURED.raise();
        pushQuery.findUser(userId).orElseThrow(NotificationErrorCode.PUSH_MEMBER_NOT_FOUND::raise);
        var devices = subscriptions.findAllActiveByUserIdIn(Set.of(userId));
        if (devices.isEmpty()) throw NotificationErrorCode.PUSH_NO_DEVICE.raise();
        pushOutbox.queueTest(userId, devices, "관리자가 보낸 테스트 알림이에요.", "/notifications", clock.instant());
        return new PushViews.PushTestQueued(devices.size());
    }
}

package xyz.goraebap.foundation.notification.infrastructure;

import static xyz.goraebap.jooq.tables.NotificationEvent.NOTIFICATION_EVENT;
import static xyz.goraebap.jooq.tables.NotificationRecipient.NOTIFICATION_RECIPIENT;
import static xyz.goraebap.jooq.tables.PushDelivery.PUSH_DELIVERY;
import static xyz.goraebap.jooq.tables.PushSubscription.PUSH_SUBSCRIPTION;
import static xyz.goraebap.jooq.tables.Users.USERS;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.foundation.notification.application.PushQuery;
import xyz.goraebap.foundation.notification.application.PushRequests;
import xyz.goraebap.foundation.notification.application.PushViews;
import xyz.goraebap.foundation.notification.domain.push.PushDelivery;
import xyz.goraebap.jooq.tables.records.PushSubscriptionRecord;

/**
 * Push devices and records for the member and for administrators. Which members count as working decides the lists
 * and counts, so it is read from the users table here (backend guideline 04); names come from the user facade.
 */
@Repository
@RequiredArgsConstructor
class JooqPushQuery implements PushQuery {
    private static final int MEMBERS_MAX = 500;
    private static final String WORKING = "ACTIVE";

    private final DSLContext dslContext;

    @Override
    public List<PushViews.PushDevice> activeDevicesOf(UUID userId) {
        return devices(PUSH_SUBSCRIPTION.USER_ACCOUNT_ID.eq(userId).and(PUSH_SUBSCRIPTION.EXPIRED_AT.isNull()), 100);
    }

    @Override
    public List<PushViews.PushDevice> devicesOf(UUID userId, int limit) {
        return devices(PUSH_SUBSCRIPTION.USER_ACCOUNT_ID.eq(userId), limit);
    }

    private List<PushViews.PushDevice> devices(Condition which, int limit) {
        var rows = dslContext
                .selectFrom(PUSH_SUBSCRIPTION)
                .where(which)
                .orderBy(
                        PUSH_SUBSCRIPTION.EXPIRED_AT.isNull().desc(),
                        PUSH_SUBSCRIPTION.LAST_SEEN_AT.desc(),
                        PUSH_SUBSCRIPTION.SUBSCRIPTION_ID)
                .limit(limit)
                .fetch();
        var last = lastPushes(rows.map(PushSubscriptionRecord::getSubscriptionId));
        return rows.map(row -> new PushViews.PushDevice(
                row.getSubscriptionId(),
                row.getDeviceName(),
                row.getUserAgent(),
                row.getCreatedAt(),
                row.getLastSeenAt(),
                row.getExpiredAt(),
                last.get(row.getSubscriptionId())));
    }

    // The latest push to each of the devices.
    private Map<UUID, PushViews.PushLastResult> lastPushes(Collection<UUID> subscriptionIds) {
        if (subscriptionIds.isEmpty()) return Map.of();
        var at = DSL.coalesce(PUSH_DELIVERY.ATTEMPTED_AT, PUSH_DELIVERY.CREATED_AT)
                .as("at");
        // Each device's deliveries numbered newest first; the first of each is its latest.
        var place = DSL.rowNumber()
                .over(DSL.partitionBy(PUSH_DELIVERY.SUBSCRIPTION_ID)
                        .orderBy(PUSH_DELIVERY.CREATED_AT.desc(), PUSH_DELIVERY.DELIVERY_ID.desc()))
                .as("place");
        var ranked = dslContext
                .select(PUSH_DELIVERY.SUBSCRIPTION_ID, PUSH_DELIVERY.STATUS, at, PUSH_DELIVERY.ERROR, place)
                .from(PUSH_DELIVERY)
                .where(PUSH_DELIVERY.SUBSCRIPTION_ID.in(subscriptionIds))
                .asTable("ranked");
        var subscription = Objects.requireNonNull(ranked.field(PUSH_DELIVERY.SUBSCRIPTION_ID));
        return dslContext
                .select(
                        subscription,
                        Objects.requireNonNull(ranked.field(PUSH_DELIVERY.STATUS)),
                        Objects.requireNonNull(ranked.field(at)),
                        Objects.requireNonNull(ranked.field(PUSH_DELIVERY.ERROR)))
                .from(ranked)
                .where(Objects.requireNonNull(ranked.field(place)).eq(1))
                .fetchMap(subscription, row -> new PushViews.PushLastResult(row.value2(), row.value3(), row.value4()));
    }

    @Override
    public List<PushViews.PushDeliveryRow> deliveriesOf(UUID employeeId, int limit) {
        return dslContext
                .select(
                        PUSH_DELIVERY.DELIVERY_ID,
                        PUSH_DELIVERY.TITLE,
                        PUSH_DELIVERY.LINK,
                        PUSH_DELIVERY.STATUS,
                        PUSH_DELIVERY.HTTP_STATUS,
                        PUSH_DELIVERY.ERROR,
                        PUSH_DELIVERY.ATTEMPTS,
                        PUSH_DELIVERY.CREATED_AT,
                        PUSH_DELIVERY.ATTEMPTED_AT,
                        PUSH_DELIVERY.SUBSCRIPTION_ID,
                        PUSH_SUBSCRIPTION.DEVICE_NAME,
                        PUSH_DELIVERY.EVENT_ID)
                .from(PUSH_DELIVERY)
                .leftJoin(PUSH_SUBSCRIPTION)
                .on(PUSH_SUBSCRIPTION.SUBSCRIPTION_ID.eq(PUSH_DELIVERY.SUBSCRIPTION_ID))
                .where(PUSH_DELIVERY.RECIPIENT_ID.eq(employeeId))
                .orderBy(PUSH_DELIVERY.CREATED_AT.desc(), PUSH_DELIVERY.DELIVERY_ID.desc())
                .limit(limit)
                .fetch(row -> new PushViews.PushDeliveryRow(
                        row.value1(),
                        row.value2(),
                        row.value3(),
                        row.value4(),
                        row.value5(),
                        row.value6(),
                        row.value7(),
                        row.value8(),
                        row.value9(),
                        row.value10(),
                        row.value11(),
                        row.value12() == null));
    }

    @Override
    public List<PushViews.NoticeKindRow> kinds(Instant since) {
        var kind = NOTIFICATION_EVENT.KIND;
        var recent = NOTIFICATION_EVENT.CREATED_AT.ge(since);
        Map<String, Long> recipients = dslContext
                .select(kind, DSL.count())
                .from(NOTIFICATION_RECIPIENT)
                .join(NOTIFICATION_EVENT)
                .on(NOTIFICATION_EVENT.EVENT_ID.eq(NOTIFICATION_RECIPIENT.EVENT_ID))
                .where(recent)
                .groupBy(kind)
                .fetchMap(kind, row -> row.value2().longValue());
        Map<String, Long> pushed = dslContext
                .select(kind, DSL.count())
                .from(PUSH_DELIVERY)
                .join(NOTIFICATION_EVENT)
                .on(NOTIFICATION_EVENT.EVENT_ID.eq(PUSH_DELIVERY.EVENT_ID))
                .where(recent)
                .and(PUSH_DELIVERY.STATUS.eq(PushDelivery.Status.SENT.name()))
                .groupBy(kind)
                .fetchMap(kind, row -> row.value2().longValue());
        Field<Integer> notices = DSL.count().filterWhere(recent);
        Field<Instant> lastAt = DSL.max(NOTIFICATION_EVENT.CREATED_AT);
        var counts = dslContext
                .select(kind, notices, lastAt)
                .from(NOTIFICATION_EVENT)
                .groupBy(kind)
                .fetchMap(kind);
        // The latest notice of each kind, as an example of what it says.
        var place = DSL.rowNumber()
                .over(DSL.partitionBy(kind).orderBy(NOTIFICATION_EVENT.CREATED_AT.desc()))
                .as("place");
        var ranked = dslContext
                .select(kind, NOTIFICATION_EVENT.TITLE, NOTIFICATION_EVENT.MESSAGE, NOTIFICATION_EVENT.LINK, place)
                .from(NOTIFICATION_EVENT)
                .asTable("ranked");
        return dslContext
                .select(
                        Objects.requireNonNull(ranked.field(kind)),
                        Objects.requireNonNull(ranked.field(NOTIFICATION_EVENT.TITLE)),
                        Objects.requireNonNull(ranked.field(NOTIFICATION_EVENT.MESSAGE)),
                        Objects.requireNonNull(ranked.field(NOTIFICATION_EVENT.LINK)))
                .from(ranked)
                .where(Objects.requireNonNull(ranked.field(place)).eq(1))
                .orderBy(Objects.requireNonNull(ranked.field(kind)))
                .fetch(row -> {
                    var count = counts.get(row.value1());
                    return new PushViews.NoticeKindRow(
                            row.value1(),
                            count == null ? 0 : count.get(notices).longValue(),
                            recipients.getOrDefault(row.value1(), 0L),
                            pushed.getOrDefault(row.value1(), 0L),
                            count == null ? null : count.get(lastAt),
                            row.value2(),
                            row.value3(),
                            row.value4());
                });
    }

    @Override
    public PushViews.PushSummary summary(Instant since, boolean configured) {
        var counts = dslContext
                .select(PUSH_DELIVERY.STATUS, DSL.count())
                .from(PUSH_DELIVERY)
                .join(USERS)
                .on(USERS.USER_ID.eq(PUSH_DELIVERY.RECIPIENT_ID))
                .where(PUSH_DELIVERY.CREATED_AT.ge(since))
                .groupBy(PUSH_DELIVERY.STATUS)
                .fetchMap(PUSH_DELIVERY.STATUS, row -> row.value2().longValue());
        Function<PushDelivery.Status, Long> count = status -> counts.getOrDefault(status.name(), 0L);
        var working = USERS.STATUS.eq(WORKING).and(USERS.DELETED_AT.isNull());
        long devices = dslContext.fetchCount(DSL.selectOne()
                .from(PUSH_SUBSCRIPTION)
                .join(USERS)
                .on(USERS.USER_ID.eq(PUSH_SUBSCRIPTION.USER_ACCOUNT_ID))
                .where(working)
                .and(PUSH_SUBSCRIPTION.EXPIRED_AT.isNull()));
        long withDevice = dslContext.fetchCount(DSL.selectDistinct(PUSH_SUBSCRIPTION.USER_ACCOUNT_ID)
                .from(PUSH_SUBSCRIPTION)
                .join(USERS)
                .on(USERS.USER_ID.eq(PUSH_SUBSCRIPTION.USER_ACCOUNT_ID))
                .where(working)
                .and(PUSH_SUBSCRIPTION.EXPIRED_AT.isNull()));
        return new PushViews.PushSummary(
                configured,
                devices,
                withDevice,
                dslContext.fetchCount(USERS, working),
                count.apply(PushDelivery.Status.SENT),
                count.apply(PushDelivery.Status.FAILED),
                count.apply(PushDelivery.Status.GONE),
                count.apply(PushDelivery.Status.NO_DEVICE),
                count.apply(PushDelivery.Status.MUTED),
                count.apply(PushDelivery.Status.PENDING));
    }

    @Override
    public List<PushViews.PushMemberRow> members(PushRequests.PushMemberListing listing, Instant since) {
        Field<Integer> devices = DSL.field(DSL.selectCount()
                .from(PUSH_SUBSCRIPTION)
                .where(PUSH_SUBSCRIPTION.USER_ACCOUNT_ID.eq(USERS.USER_ID))
                .and(PUSH_SUBSCRIPTION.EXPIRED_AT.isNull()));
        var recent = PUSH_DELIVERY.RECIPIENT_ID.eq(USERS.USER_ID).and(PUSH_DELIVERY.CREATED_AT.ge(since));
        Field<Integer> sent = counted(recent.and(PUSH_DELIVERY.STATUS.eq(PushDelivery.Status.SENT.name())));
        Field<Integer> failed = counted(recent.and(
                PUSH_DELIVERY.STATUS.in(PushDelivery.Status.FAILED.name(), PushDelivery.Status.GONE.name())));
        Field<Integer> noDevice = counted(recent.and(PUSH_DELIVERY.STATUS.eq(PushDelivery.Status.NO_DEVICE.name())));
        var latest = PUSH_DELIVERY.as("latest");
        Field<Instant> lastAt = DSL.field(
                DSL.select(DSL.max(latest.CREATED_AT)).from(latest).where(latest.RECIPIENT_ID.eq(USERS.USER_ID)));
        Field<String> lastStatus = DSL.field(DSL.select(latest.STATUS)
                .from(latest)
                .where(latest.RECIPIENT_ID.eq(USERS.USER_ID))
                .orderBy(latest.CREATED_AT.desc(), latest.DELIVERY_ID.desc())
                .limit(1));
        Condition where = USERS.STATUS.eq(WORKING).and(USERS.DELETED_AT.isNull());
        if (listing.q() != null) where = where.and(USERS.NAME.containsIgnoreCase(listing.q()));
        where = switch (listing.state()) {
            case ALL -> where;
            case FAILED -> where.and(failed.gt(0));
            case NO_DEVICE -> where.and(devices.eq(0));
        };
        return dslContext
                .select(USERS.USER_ID, USERS.NAME, devices, lastAt, lastStatus, sent, failed, noDevice)
                .from(USERS)
                .where(where)
                .orderBy(USERS.NAME, USERS.USER_ID)
                .limit(MEMBERS_MAX)
                .fetch(row -> new PushViews.PushMemberRow(
                        row.value1(),
                        row.value2(),
                        row.value3(),
                        row.value4(),
                        row.value5(),
                        row.value6(),
                        row.value7(),
                        row.value8()));
    }

    private Field<Integer> counted(Condition condition) {
        return DSL.field(DSL.selectCount().from(PUSH_DELIVERY).where(condition));
    }

    @Override
    public Optional<UUID> findEmployee(UUID employeeId) {
        return dslContext
                .select(USERS.USER_ID)
                .from(USERS)
                .where(USERS.USER_ID.eq(employeeId))
                .and(USERS.DELETED_AT.isNull())
                .fetchOptional(USERS.USER_ID);
    }
}

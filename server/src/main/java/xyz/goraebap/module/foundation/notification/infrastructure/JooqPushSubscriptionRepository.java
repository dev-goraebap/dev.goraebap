package xyz.goraebap.module.foundation.notification.infrastructure;

import static xyz.goraebap.jooq.tables.PushSubscription.PUSH_SUBSCRIPTION;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.jooq.tables.records.PushSubscriptionRecord;
import xyz.goraebap.module.foundation.notification.domain.push.PushSubscription;
import xyz.goraebap.module.foundation.notification.domain.push.PushSubscriptionRepository;

@Repository
@RequiredArgsConstructor
class JooqPushSubscriptionRepository implements PushSubscriptionRepository {
    private final DSLContext dslContext;

    @Override
    public Optional<PushSubscription> findById(UUID id) {
        return dslContext
                .selectFrom(PUSH_SUBSCRIPTION)
                .where(PUSH_SUBSCRIPTION.SUBSCRIPTION_ID.eq(id))
                .fetchOptional(this::toDomain);
    }

    @Override
    public Optional<PushSubscription> findByEndpointForUpdate(String endpoint) {
        return dslContext
                .selectFrom(PUSH_SUBSCRIPTION)
                .where(PUSH_SUBSCRIPTION.ENDPOINT.eq(endpoint))
                .fetchOptional(this::toDomain);
    }

    @Override
    public List<PushSubscription> findAllActiveByUserIdIn(Collection<UUID> userIds) {
        if (userIds.isEmpty()) return List.of();
        return dslContext
                .selectFrom(PUSH_SUBSCRIPTION)
                .where(PUSH_SUBSCRIPTION.USER_ACCOUNT_ID.in(userIds))
                .and(PUSH_SUBSCRIPTION.EXPIRED_AT.isNull())
                .orderBy(PUSH_SUBSCRIPTION.CREATED_AT, PUSH_SUBSCRIPTION.SUBSCRIPTION_ID)
                .fetch(this::toDomain);
    }

    @Override
    public List<PushSubscription> findAllById(Collection<UUID> ids) {
        if (ids.isEmpty()) return List.of();
        return dslContext
                .selectFrom(PUSH_SUBSCRIPTION)
                .where(PUSH_SUBSCRIPTION.SUBSCRIPTION_ID.in(ids))
                .fetch(this::toDomain);
    }

    @Override
    public void save(PushSubscription subscription) {
        dslContext
                .insertInto(PUSH_SUBSCRIPTION)
                .set(PUSH_SUBSCRIPTION.SUBSCRIPTION_ID, subscription.id())
                .set(PUSH_SUBSCRIPTION.USER_ACCOUNT_ID, subscription.userId())
                .set(PUSH_SUBSCRIPTION.ENDPOINT, subscription.endpoint())
                .set(PUSH_SUBSCRIPTION.P256DH, subscription.p256dh())
                .set(PUSH_SUBSCRIPTION.AUTH, subscription.auth())
                .set(PUSH_SUBSCRIPTION.USER_AGENT, subscription.userAgent())
                .set(PUSH_SUBSCRIPTION.DEVICE_NAME, subscription.deviceName())
                .set(PUSH_SUBSCRIPTION.CREATED_AT, subscription.createdAt())
                .set(PUSH_SUBSCRIPTION.LAST_SEEN_AT, subscription.lastSeenAt())
                .set(PUSH_SUBSCRIPTION.EXPIRED_AT, subscription.expiredAt())
                .onConflict(PUSH_SUBSCRIPTION.SUBSCRIPTION_ID)
                .doUpdate()
                .set(PUSH_SUBSCRIPTION.USER_ACCOUNT_ID, subscription.userId())
                .set(PUSH_SUBSCRIPTION.P256DH, subscription.p256dh())
                .set(PUSH_SUBSCRIPTION.AUTH, subscription.auth())
                .set(PUSH_SUBSCRIPTION.USER_AGENT, subscription.userAgent())
                .set(PUSH_SUBSCRIPTION.DEVICE_NAME, subscription.deviceName())
                .set(PUSH_SUBSCRIPTION.LAST_SEEN_AT, subscription.lastSeenAt())
                .set(PUSH_SUBSCRIPTION.EXPIRED_AT, subscription.expiredAt())
                .execute();
    }

    private PushSubscription toDomain(PushSubscriptionRecord row) {
        return new PushSubscription(
                row.getSubscriptionId(),
                row.getUserAccountId(),
                row.getEndpoint(),
                row.getP256dh(),
                row.getAuth(),
                row.getUserAgent(),
                row.getDeviceName(),
                row.getCreatedAt(),
                row.getLastSeenAt(),
                row.getExpiredAt());
    }
}

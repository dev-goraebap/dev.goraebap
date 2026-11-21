package xyz.goraebap.cowork.module.notification.infrastructure;

import static xyz.goraebap.cowork.jooq.tables.PushDelivery.PUSH_DELIVERY;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.cowork.jooq.tables.records.PushDeliveryRecord;
import xyz.goraebap.cowork.module.notification.domain.push.PushDelivery;
import xyz.goraebap.cowork.module.notification.domain.push.PushDeliveryRepository;

@Repository
@RequiredArgsConstructor
class JooqPushDeliveryRepository implements PushDeliveryRepository {
    private final DSLContext dslContext;

    @Override
    public List<PushDelivery> findAllDueForUpdate(Instant now, int limit) {
        // A retried push waits a minute more after each try, as PushDelivery.isDue says; a pending push has had fewer
        // than MAX_ATTEMPTS tries, so each count of tries so far gets its own wait.
        var due = PUSH_DELIVERY.ATTEMPTED_AT.isNull();
        for (int tries = 1; tries < PushDelivery.MAX_ATTEMPTS; tries++)
            due = due.or(PUSH_DELIVERY
                    .ATTEMPTS
                    .eq(tries)
                    .and(PUSH_DELIVERY.ATTEMPTED_AT.le(now.minus(Duration.ofMinutes(tries)))));
        return dslContext
                .selectFrom(PUSH_DELIVERY)
                .where(PUSH_DELIVERY.STATUS.eq(PushDelivery.Status.PENDING.name()))
                .and(due)
                .orderBy(PUSH_DELIVERY.CREATED_AT, PUSH_DELIVERY.DELIVERY_ID)
                .limit(limit)
                .fetch(this::toDomain);
    }

    @Override
    public void saveAll(Collection<PushDelivery> deliveries) {
        if (deliveries.isEmpty()) return;
        dslContext
                .batch(deliveries.stream()
                        .map(delivery -> dslContext
                                .insertInto(PUSH_DELIVERY)
                                .set(PUSH_DELIVERY.DELIVERY_ID, delivery.id())
                                .set(PUSH_DELIVERY.EVENT_ID, delivery.eventId())
                                .set(PUSH_DELIVERY.RECIPIENT_ID, delivery.recipientId())
                                .set(PUSH_DELIVERY.SUBSCRIPTION_ID, delivery.subscriptionId())
                                .set(PUSH_DELIVERY.TITLE, delivery.title())
                                .set(PUSH_DELIVERY.LINK, delivery.link())
                                .set(PUSH_DELIVERY.STATUS, delivery.status().name())
                                .set(PUSH_DELIVERY.ATTEMPTS, delivery.attempts())
                                .set(PUSH_DELIVERY.HTTP_STATUS, delivery.httpStatus())
                                .set(PUSH_DELIVERY.ERROR, delivery.error())
                                .set(PUSH_DELIVERY.CREATED_AT, delivery.createdAt())
                                .set(PUSH_DELIVERY.ATTEMPTED_AT, delivery.attemptedAt())
                                .onConflict(PUSH_DELIVERY.DELIVERY_ID)
                                .doUpdate()
                                .set(PUSH_DELIVERY.STATUS, delivery.status().name())
                                .set(PUSH_DELIVERY.ATTEMPTS, delivery.attempts())
                                .set(PUSH_DELIVERY.HTTP_STATUS, delivery.httpStatus())
                                .set(PUSH_DELIVERY.ERROR, delivery.error())
                                .set(PUSH_DELIVERY.ATTEMPTED_AT, delivery.attemptedAt()))
                        .toList())
                .execute();
    }

    @Override
    public int deleteByCreatedAtBefore(Instant moment) {
        return dslContext
                .deleteFrom(PUSH_DELIVERY)
                .where(PUSH_DELIVERY.CREATED_AT.lt(moment))
                .execute();
    }

    private PushDelivery toDomain(PushDeliveryRecord row) {
        return new PushDelivery(
                row.getDeliveryId(),
                row.getEventId(),
                row.getRecipientId(),
                row.getSubscriptionId(),
                row.getTitle(),
                row.getLink(),
                PushDelivery.Status.valueOf(row.getStatus()),
                row.getAttempts(),
                row.getHttpStatus(),
                row.getError(),
                row.getCreatedAt(),
                row.getAttemptedAt());
    }
}

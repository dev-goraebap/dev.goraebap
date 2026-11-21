package xyz.goraebap.foundation.notification.application;

import jakarta.annotation.PreDestroy;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;
import xyz.goraebap.foundation.notification.domain.push.PushDelivery;
import xyz.goraebap.foundation.notification.domain.push.PushDeliveryRepository;
import xyz.goraebap.foundation.notification.domain.push.PushSubscription;
import xyz.goraebap.foundation.notification.domain.push.PushSubscriptionRepository;
import xyz.goraebap.foundation.realtime.RealtimeFacade;
import xyz.goraebap.foundation.realtime.Signal;
import xyz.goraebap.shared.config.Product;

/**
 * Sends waiting pushes: at once, off the request's thread, when a transaction that queued some commits, and again on
 * the scheduler's round for those left to retry. The server runs as one instance and one drain runs at a time, so a
 * push is never sent twice. A batch is read in one short transaction, sent with no transaction open, and its outcomes
 * saved in another, so the database's single write lock is never held while push services answer. A device its push
 * service calls gone is ended. Each batch's outcomes are signalled (PUSH) to their recipients and administrators, whose
 * screens read them again instead of polling.
 */
@Slf4j
@Component
class PushDispatcher {
    private static final int BATCH = 20;

    private final PushDeliveryRepository deliveries;
    private final PushSubscriptionRepository subscriptions;
    private final PushGateway pushGateway;
    private final RealtimeFacade realtimeFacade;
    private final TransactionTemplate transactions;
    private final Clock clock;
    private final ExecutorService sender = Executors.newSingleThreadExecutor(
            Thread.ofVirtual().name("push-sender").factory());
    /** The sender and the scheduler's round take turns, so a batch read by one is not sent by the other too. */
    private final ReentrantLock draining = new ReentrantLock();

    private record Batch(List<PushDelivery> due, Map<UUID, PushSubscription> devices) {}

    PushDispatcher(
            PushDeliveryRepository deliveries,
            PushSubscriptionRepository subscriptions,
            PushGateway pushGateway,
            RealtimeFacade realtimeFacade,
            PlatformTransactionManager transactionManager,
            Clock clock) {
        this.deliveries = deliveries;
        this.subscriptions = subscriptions;
        this.pushGateway = pushGateway;
        this.realtimeFacade = realtimeFacade;
        this.transactions = new TransactionTemplate(transactionManager);
        this.clock = clock;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    void onQueued(PushQueued queued) {
        sender.execute(this::drain);
    }

    /** Sends every push whose turn has come, a batch at a time, until none is left. */
    void drain() {
        if (!pushGateway.isConfigured()) return;
        draining.lock();
        try {
            int sent;
            do sent = sendBatch();
            while (sent == BATCH);
        } catch (RuntimeException e) {
            log.warn("sending pushes failed; the next round tries again", e);
        } finally {
            draining.unlock();
        }
    }

    private int sendBatch() {
        var batch = transactions.execute(status -> due());
        if (batch == null || batch.due().isEmpty()) return 0;
        var due = batch.due();
        var devices = batch.devices();
        var answered = new ArrayList<PushDelivery>();
        var ended = new ArrayList<PushSubscription>();
        for (var delivery : due) {
            var device = devices.get(delivery.subscriptionId());
            if (device == null || !device.isActive()) {
                answered.add(delivery.gone(clock.instant()));
                continue;
            }
            var answer = pushGateway.send(
                    device,
                    new PushGateway.PushMessage(
                            Product.NAME,
                            delivery.title(),
                            delivery.link() == null ? "/inbox" : delivery.link(),
                            Objects.requireNonNullElse(delivery.eventId(), delivery.id())
                                    .toString(),
                            // Only a test has no notice behind it.
                            delivery.eventId() == null));
            var next = delivery.answered(answer.httpStatus(), answer.error(), answer.retriable(), clock.instant());
            answered.add(next);
            if (next.status() == PushDelivery.Status.GONE) {
                var gone = device.ended(clock.instant());
                ended.add(gone);
                devices.put(device.id(), gone);
            }
        }
        transactions.executeWithoutResult(status -> {
            deliveries.saveAll(answered);
            ended.forEach(subscriptions::save);
            // Once the outcomes commit, the recipients' and administrators' screens read them again.
            realtimeFacade.signal(Signal.to(
                            Signal.Topic.PUSH,
                            due.getFirst().id(),
                            due.stream()
                                    .map(PushDelivery::recipientId)
                                    .distinct()
                                    .toList())
                    .andAdministrators());
        });
        return due.size();
    }

    /** The pushes whose turn has come, with their devices. */
    private Batch due() {
        var due = deliveries.findAllDueForUpdate(clock.instant(), BATCH);
        if (due.isEmpty()) return new Batch(List.of(), Map.of());
        var devices = subscriptions
                .findAllById(due.stream()
                        .map(PushDelivery::subscriptionId)
                        .filter(Objects::nonNull)
                        .distinct()
                        .toList())
                .stream()
                .collect(Collectors.toMap(PushSubscription::id, Function.identity()));
        return new Batch(due, devices);
    }

    @PreDestroy
    void stop() {
        sender.shutdownNow();
    }
}

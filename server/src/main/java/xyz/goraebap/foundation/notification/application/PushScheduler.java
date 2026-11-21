package xyz.goraebap.foundation.notification.application;

import java.time.Clock;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.foundation.notification.domain.push.PushDeliveryRepository;

/**
 * Every minute sends the pushes left waiting (retries, or ones queued while a server stopped), and every night drops
 * the record of pushes older than 90 days. app.jobs.enabled=false turns it off, as in tests.
 */
@Component
@ConditionalOnProperty(name = "app.jobs.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
class PushScheduler {
    private static final Duration KEPT = Duration.ofDays(90);

    private final PushDispatcher pushDispatcher;
    private final PushDeliveryRepository deliveries;
    private final Clock clock;

    @Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT1M")
    void retry() {
        pushDispatcher.drain();
    }

    @Scheduled(cron = "0 40 3 * * *", zone = "Asia/Seoul")
    @Transactional
    void forget() {
        deliveries.deleteByCreatedAtBefore(clock.instant().minus(KEPT));
    }
}

package xyz.goraebap.foundation.outbox.application;

import java.time.Clock;
import java.time.Duration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import jakarta.annotation.PreDestroy;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import xyz.goraebap.foundation.outbox.domain.OutboxRepository;

/**
 * Looks at the outbox as soon as a transaction that added to it commits, every minute for the lines that wait for
 * another attempt (or were left when a server stopped), and every night drops the lines done more than a week ago.
 * app.jobs.enabled=false turns it off, as in tests, which drain by hand.
 */
@Component
@ConditionalOnProperty(name = "app.jobs.enabled", havingValue = "true", matchIfMissing = true)
class OutboxScheduler {
    private static final Duration KEPT = Duration.ofDays(7);

    private final OutboxProcessor outboxProcessor;
    private final OutboxRepository outboxRepository;
    private final Clock clock;
    private final ExecutorService worker = Executors.newSingleThreadExecutor(runnable -> {
        var thread = new Thread(runnable, "outbox");
        thread.setDaemon(true);
        return thread;
    });

    OutboxScheduler(OutboxProcessor outboxProcessor, OutboxRepository outboxRepository, Clock clock) {
        this.outboxProcessor = outboxProcessor;
        this.outboxRepository = outboxRepository;
        this.clock = clock;
    }

    /** Off the committing thread, so the request that added the line does not wait for its handler. */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    void added(OutboxService.OutboxAdded added) {
        worker.execute(outboxProcessor::drain);
    }

    @Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT30S")
    void retry() {
        outboxProcessor.drain();
    }

    @Scheduled(cron = "0 50 3 * * *", zone = "Asia/Seoul")
    @Transactional
    void forget() {
        outboxRepository.deleteDoneBefore(clock.instant().minus(KEPT));
    }

    @PreDestroy
    void stop() {
        worker.shutdown();
    }
}

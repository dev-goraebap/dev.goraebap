package xyz.goraebap.foundation.outbox.application;

import java.time.Clock;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.locks.ReentrantLock;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import xyz.goraebap.foundation.outbox.OutboxHandlerSpi;
import xyz.goraebap.foundation.outbox.OutboxMessage;
import xyz.goraebap.foundation.outbox.domain.OutboxRepository;
import xyz.goraebap.foundation.shared.error.BusinessException;
import xyz.goraebap.foundation.shared.error.DomainRuleViolation;

/**
 * Hands the lines that are due to their handlers, one at a time and in order. A handler runs outside the outbox's own
 * transaction, in whatever transaction it opens in its own database; the line is marked afterwards, so a crash in
 * between hands it over again and the handler must not mind.
 *
 * <p>A business refusal fails the line at once. Anything else is tried again after a growing wait, and fails for good
 * once the waits run out. A failed line stays, holds back the later lines of its ordering key, and waits for an
 * administrator to try it again or drop it.
 */
@Slf4j
@Component
public class OutboxProcessor {
    /** The wait before each further attempt; a line fails for good after the last one. */
    static final List<Duration> WAITS = List.of(
            Duration.ofMinutes(1),
            Duration.ofMinutes(5),
            Duration.ofMinutes(30),
            Duration.ofHours(2),
            Duration.ofHours(6),
            Duration.ofHours(12),
            Duration.ofHours(24));

    private static final int BATCH = 50;
    private static final int ERROR_MAX = 500;

    private final OutboxRepository outboxRepository;
    private final Map<String, OutboxHandlerSpi> handlers = new HashMap<>();
    private final TransactionTemplate transactions;
    private final Clock clock;
    private final ReentrantLock draining = new ReentrantLock();

    OutboxProcessor(
            OutboxRepository outboxRepository,
            List<OutboxHandlerSpi> handlers,
            PlatformTransactionManager transactionManager,
            Clock clock) {
        this.outboxRepository = outboxRepository;
        for (var handler : handlers)
            if (this.handlers.put(handler.topic(), handler) != null)
                throw new IllegalStateException("Outbox topic handled twice: " + handler.topic());
        this.transactions = new TransactionTemplate(transactionManager);
        this.clock = clock;
    }

    /**
     * Handles every line that is due now and returns how many it handed over. Only one drain runs at a time; a second
     * caller returns at once, since the first will reach the same lines.
     */
    public int drain() {
        if (!draining.tryLock()) return 0;
        try {
            int handed = 0;
            while (true) {
                List<OutboxMessage> due =
                        transactions.execute(status -> outboxRepository.findDue(clock.instant(), BATCH));
                if (due == null || due.isEmpty()) return handed;
                for (var message : due) handed += handOver(message) ? 1 : 0;
                // A line that failed or waits keeps its key's later lines out of the next read, so the loop ends.
            }
        } finally {
            draining.unlock();
        }
    }

    /** True when the handler was called, whatever came of it. */
    private boolean handOver(OutboxMessage message) {
        // An earlier line of the same key may have failed or been put off within this batch.
        if (message.orderingKey() != null && !stillFirst(message)) return false;
        var handler = handlers.get(message.topic());
        if (handler == null) {
            fail(message, message.attempts(), "이 주제를 처리하는 곳이 없습니다: " + message.topic());
            return false;
        }
        int attempts = message.attempts() + 1;
        try {
            handler.handle(message);
        } catch (BusinessException | DomainRuleViolation refused) {
            fail(message, attempts, refused.getMessage());
            return true;
        } catch (RuntimeException failure) {
            if (attempts > WAITS.size()) {
                log.error("Outbox line {} ({}) failed for good", message.id(), message.topic(), failure);
                fail(message, attempts, describe(failure));
            } else {
                log.warn("Outbox line {} ({}) failed, attempt {}", message.id(), message.topic(), attempts, failure);
                var next = clock.instant().plus(WAITS.get(attempts - 1));
                transactions.executeWithoutResult(
                        status -> outboxRepository.markRetry(message.id(), attempts, next, cut(describe(failure))));
            }
            return true;
        }
        transactions.executeWithoutResult(status -> outboxRepository.markDone(message.id(), clock.instant()));
        return true;
    }

    private boolean stillFirst(OutboxMessage message) {
        List<OutboxMessage> due = transactions.execute(status -> outboxRepository.findDue(clock.instant(), BATCH));
        return due != null && due.stream().anyMatch(each -> each.id() == message.id());
    }

    private void fail(OutboxMessage message, int attempts, String error) {
        transactions.executeWithoutResult(
                status -> outboxRepository.markFailed(message.id(), attempts, cut(error), clock.instant()));
    }

    private static String describe(RuntimeException failure) {
        String message = failure.getMessage();
        return message == null || message.isBlank() ? failure.getClass().getSimpleName() : message;
    }

    private static String cut(String text) {
        if (text == null) return null;
        return text.length() <= ERROR_MAX ? text : text.substring(0, ERROR_MAX);
    }
}

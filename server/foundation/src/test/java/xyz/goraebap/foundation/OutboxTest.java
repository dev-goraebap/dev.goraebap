package xyz.goraebap.foundation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import xyz.goraebap.foundation.outbox.Outbox;
import xyz.goraebap.foundation.outbox.OutboxHandlerSpi;
import xyz.goraebap.foundation.outbox.OutboxMessage;
import xyz.goraebap.foundation.outbox.application.OutboxProcessor;
import xyz.goraebap.foundation.outbox.application.OutboxService;
import xyz.goraebap.foundation.shared.error.BusinessException;
import xyz.goraebap.foundation.shared.error.DomainRuleViolation;
import xyz.goraebap.foundation.support.TestDatabase;

/**
 * The outbox: a line is kept exactly when its command is, handed to its handler after the commit, tried again while
 * that fails for a passing reason, and left for an administrator once it fails for good. Jobs are off in tests, so
 * each test drains by hand.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(OutboxTest.Handlers.class)
class OutboxTest {
    private static final List<String> HANDLED = new ArrayList<>();
    private static final AtomicInteger FLAKY_FAILURES = new AtomicInteger();

    @Autowired
    Outbox outbox;

    @Autowired
    OutboxService outboxService;

    @Autowired
    OutboxProcessor processor;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    PlatformTransactionManager transactionManager;

    TransactionTemplate transactions;

    @BeforeEach
    void prepare() {
        TestDatabase.clear(jdbc);
        HANDLED.clear();
        FLAKY_FAILURES.set(0);
        transactions = new TransactionTemplate(transactionManager);
    }

    @Test
    void aLineIsAddedOnlyInsideTheCommandsTransaction() {
        assertThatThrownBy(() -> outbox.add("test.ok", null, "a")).isInstanceOf(IllegalTransactionStateException.class);
        assertThat(count()).isZero();
    }

    @Test
    void aLineIsHandledOnceAfterItsCommandCommits() {
        add("test.ok", null, "a");
        assertThat(HANDLED).isEmpty();
        assertThat(processor.drain()).isEqualTo(1);
        assertThat(HANDLED).containsExactly("a");
        assertThat(status("a")).isEqualTo("DONE");
        assertThat(processor.drain()).isZero();
        assertThat(HANDLED).containsExactly("a");
    }

    @Test
    void aCommandThatRollsBackLeavesNoLine() {
        assertThatThrownBy(() -> transactions.executeWithoutResult(status -> {
                    outbox.add("test.ok", null, "a");
                    throw new IllegalStateException("the command failed");
                }))
                .isInstanceOf(IllegalStateException.class);
        assertThat(count()).isZero();
        assertThat(processor.drain()).isZero();
    }

    @Test
    void aPassingFailureIsTriedAgainAfterAWait() {
        FLAKY_FAILURES.set(1);
        add("test.flaky", null, "a");
        processor.drain();
        assertThat(status("a")).isEqualTo("PENDING");
        assertThat(attempts("a")).isEqualTo(1);
        assertThat(lastError("a")).isEqualTo("storage is away");
        // The wait has not passed, so another look does nothing.
        assertThat(processor.drain()).isZero();
        assertThat(HANDLED).isEmpty();

        makeDue("a");
        assertThat(processor.drain()).isEqualTo(1);
        assertThat(HANDLED).containsExactly("a");
        assertThat(status("a")).isEqualTo("DONE");
        assertThat(lastError("a")).isNull();
    }

    @Test
    void aLineFailsForGoodOnceTheWaitsRunOut() {
        FLAKY_FAILURES.set(Integer.MAX_VALUE);
        add("test.flaky", null, "a");
        for (int attempt = 1; attempt <= 7; attempt++) {
            processor.drain();
            assertThat(status("a")).isEqualTo("PENDING");
            assertThat(attempts("a")).isEqualTo(attempt);
            makeDue("a");
        }
        processor.drain();
        assertThat(status("a")).isEqualTo("FAILED");
        assertThat(attempts("a")).isEqualTo(8);
        assertThat(processor.drain()).isZero();
    }

    @Test
    void aBusinessRefusalFailsAtOnceAndHoldsBackItsKeysLaterLines() {
        add("test.refuse", "document:1", "first");
        add("test.ok", "document:1", "second");
        add("test.ok", "document:2", "other");
        processor.drain();
        assertThat(status("first")).isEqualTo("FAILED");
        assertThat(attempts("first")).isEqualTo(1);
        assertThat(lastError("first")).isEqualTo("이미 지워진 문서입니다");
        // The same key waits behind the failed line; another key goes on.
        assertThat(status("second")).isEqualTo("PENDING");
        assertThat(HANDLED).containsExactly("other");

        var failed = outboxService.failed();
        assertThat(failed).hasSize(1);
        assertThat(failed.get(0).topic()).isEqualTo("test.refuse");
        assertThat(failed.get(0).orderingKey()).isEqualTo("document:1");

        outboxService.discard("foundation", failed.get(0).id());
        processor.drain();
        assertThat(HANDLED).containsExactly("other", "second");
        assertThat(outboxService.failed()).isEmpty();
    }

    @Test
    void aFailedLineIsTriedAgainFromItsFirstAttempt() {
        FLAKY_FAILURES.set(Integer.MAX_VALUE);
        add("test.flaky", null, "a");
        jdbc.update("UPDATE outbox_message SET attempts = 7 WHERE payload = 'a'");
        processor.drain();
        assertThat(status("a")).isEqualTo("FAILED");

        FLAKY_FAILURES.set(0);
        outboxService.retry("foundation", outboxService.failed().get(0).id());
        assertThat(status("a")).isEqualTo("PENDING");
        assertThat(attempts("a")).isZero();
        processor.drain();
        assertThat(HANDLED).containsExactly("a");
        assertThat(status("a")).isEqualTo("DONE");
    }

    @Test
    void onlyAFailedLineIsTriedAgainOrDropped() {
        add("test.ok", null, "a");
        long id = jdbc.queryForObject("SELECT outbox_id FROM outbox_message WHERE payload = 'a'", Long.class);
        assertThatThrownBy(() -> outboxService.retry("foundation", id)).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> outboxService.discard("foundation", id)).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> outboxService.retry("foundation", id + 100)).isInstanceOf(BusinessException.class);
        assertThat(count()).isEqualTo(1);
    }

    @Test
    void linesOfOneKeyAreHandledInTheOrderTheyWereAdded() {
        FLAKY_FAILURES.set(1);
        add("test.flaky", "file:1", "attach");
        add("test.ok", "file:1", "detach");
        processor.drain();
        // The first waits for another attempt, so the second waits too rather than overtake it.
        assertThat(HANDLED).isEmpty();
        makeDue("attach");
        processor.drain();
        assertThat(HANDLED).containsExactly("attach", "detach");
    }

    @Test
    void aTopicNobodyHandlesFailsAtOnce() {
        add("test.unknown", null, "a");
        assertThat(processor.drain()).isZero();
        assertThat(status("a")).isEqualTo("FAILED");
        assertThat(lastError("a")).contains("test.unknown");
    }

    private void add(String topic, String key, String payload) {
        transactions.executeWithoutResult(status -> outbox.add(topic, key, payload));
    }

    private void makeDue(String payload) {
        jdbc.update(
                "UPDATE outbox_message SET next_attempt_at = '2000-01-01T00:00:00.000000Z' WHERE payload = ?", payload);
    }

    private int count() {
        return jdbc.queryForObject("SELECT count(*) FROM outbox_message", Integer.class);
    }

    private String status(String payload) {
        return jdbc.queryForObject("SELECT status FROM outbox_message WHERE payload = ?", String.class, payload);
    }

    private int attempts(String payload) {
        return jdbc.queryForObject("SELECT attempts FROM outbox_message WHERE payload = ?", Integer.class, payload);
    }

    private String lastError(String payload) {
        return jdbc.queryForObject("SELECT last_error FROM outbox_message WHERE payload = ?", String.class, payload);
    }

    @TestConfiguration
    static class Handlers {
        @Bean
        OutboxHandlerSpi ok() {
            return handler("test.ok", message -> HANDLED.add(message.payload()));
        }

        @Bean
        OutboxHandlerSpi flaky() {
            return handler("test.flaky", message -> {
                if (FLAKY_FAILURES.getAndUpdate(left -> left > 0 ? left - 1 : 0) > 0)
                    throw new IllegalStateException("storage is away");
                HANDLED.add(message.payload());
            });
        }

        @Bean
        OutboxHandlerSpi refuse() {
            return handler("test.refuse", message -> {
                throw new DomainRuleViolation("이미 지워진 문서입니다");
            });
        }

        private static OutboxHandlerSpi handler(String topic, java.util.function.Consumer<OutboxMessage> body) {
            return new OutboxHandlerSpi() {
                @Override
                public String topic() {
                    return topic;
                }

                @Override
                public void handle(OutboxMessage message) {
                    body.accept(message);
                }
            };
        }
    }
}

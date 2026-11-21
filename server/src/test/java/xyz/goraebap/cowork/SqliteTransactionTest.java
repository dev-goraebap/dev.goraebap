package xyz.goraebap.cowork;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import xyz.goraebap.cowork.support.TestDatabase;

/**
 * How SQLite transactions share the one database file: a read-only transaction does not take the write lock, so reads
 * run side by side and beside a write, while it still refuses to write; a write after it on the same connection works.
 */
@SpringBootTest
@ActiveProfiles("test")
@Tag("integration")
class SqliteTransactionTest {
    // Well under busy_timeout (5s): a transaction that waited for the write lock would miss it.
    private static final Duration QUICK = Duration.ofSeconds(2);

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    PlatformTransactionManager transactionManager;

    TransactionTemplate reading;
    TransactionTemplate writing;

    @BeforeEach
    void setUp() {
        TestDatabase.clear(jdbc);
        reading = new TransactionTemplate(transactionManager);
        reading.setReadOnly(true);
        writing = new TransactionTemplate(transactionManager);
    }

    @Test
    void readOnlyTransactionsRunBesideEachOtherAndBesideAWrite() throws Exception {
        var held = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var holder = CompletableFuture.runAsync(() -> reading.executeWithoutResult(status -> {
            jdbc.queryForObject("SELECT count(*) FROM work_item_type", Integer.class);
            held.countDown();
            await(release);
        }));
        assertThat(held.await(5, TimeUnit.SECONDS)).isTrue();
        try {
            assertThat(CompletableFuture.supplyAsync(() -> reading.execute(status ->
                                    jdbc.queryForObject("SELECT count(*) FROM work_item_type", Integer.class)))
                            .get(QUICK.toMillis(), TimeUnit.MILLISECONDS))
                    .isEqualTo(5);
            CompletableFuture.runAsync(() -> writing.executeWithoutResult(
                            status -> jdbc.update("UPDATE work_item_type SET name = '작업2' WHERE code = 'TASK'")))
                    .get(QUICK.toMillis(), TimeUnit.MILLISECONDS);
        } finally {
            release.countDown();
            holder.get(5, TimeUnit.SECONDS);
        }
        assertThat(jdbc.queryForObject("SELECT name FROM work_item_type WHERE code = 'TASK'", String.class))
                .isEqualTo("작업2");
    }

    @Test
    void aReadOnlyTransactionRefusesToWriteAndLeavesTheConnectionWritable() {
        assertThatThrownBy(() -> reading.executeWithoutResult(
                        status -> jdbc.update("UPDATE work_item_type SET name = 'x' WHERE code = 'TASK'")))
                .hasMessageContaining("readonly");
        // The same thread gets the same pooled connection back: writes after the read-only transaction still work,
        // in a transaction and on their own.
        writing.executeWithoutResult(
                status -> jdbc.update("UPDATE work_item_type SET name = '작업2' WHERE code = 'TASK'"));
        reading.executeWithoutResult(status -> jdbc.queryForObject("SELECT 1", Integer.class));
        jdbc.update("UPDATE work_item_type SET name = '작업3' WHERE code = 'TASK'");
        assertThat(jdbc.queryForObject("SELECT name FROM work_item_type WHERE code = 'TASK'", String.class))
                .isEqualTo("작업3");
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await(10, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

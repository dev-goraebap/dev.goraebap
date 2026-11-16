package xyz.goraebap.foundation.system.infrastructure;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.jooq.DSLContext;
import org.jooq.SQLDialect;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import xyz.goraebap.foundation.system.application.LogStoreHealth;

/**
 * The log database: a SQLite file of its own (app.system.log-db, beside the business one by default), opened on first
 * use and migrated from db/foundation-logs. It is not a Spring data source, so nothing of the business side ever touches it and
 * it never takes part in a business transaction.
 *
 * <p>Nothing here may stop the server: a file that cannot be opened, migrated or written leaves the store marked
 * failing (health) and is tried again a minute later, while the server goes on without its records.
 */
@Slf4j
@Component
public class LogDatabase implements LogStoreHealth {
    private static final Duration RETRY = Duration.ofMinutes(1);

    private final Path file;
    private final Clock clock;
    private final AtomicLong lost = new AtomicLong();
    private volatile HikariDataSource dataSource;
    private volatile DSLContext dsl;
    private volatile Problem problem;

    /** Why the store is failing and since when; message is the last cause. */
    record Problem(Instant since, Instant lastTriedAt, String message) {}

    LogDatabase(@Value("${app.system.log-db:./data/logs.db}") String file, Clock clock) {
        this.file = Path.of(file).toAbsolutePath().normalize();
        this.clock = clock;
    }

    /** The open database, or empty while it cannot be opened (tried again at most once a minute). */
    synchronized Optional<DSLContext> dsl() {
        if (dsl != null) return Optional.of(dsl);
        if (problem != null && problem.lastTriedAt().plus(RETRY).isAfter(clock.instant())) return Optional.empty();
        try {
            Path folder = file.getParent();
            if (folder != null) Files.createDirectories(folder);
            var config = new HikariConfig();
            config.setPoolName("logs");
            config.setJdbcUrl("jdbc:sqlite:" + file);
            config.setMaximumPoolSize(3);
            config.setInitializationFailTimeout(-1);
            config.addDataSourceProperty("journal_mode", "WAL");
            config.addDataSourceProperty("synchronous", "NORMAL");
            config.addDataSourceProperty("busy_timeout", "5000");
            var opened = new HikariDataSource(config);
            try {
                Flyway.configure()
                        .dataSource(opened)
                        .locations("classpath:db/foundation-logs")
                        .load()
                        .migrate();
            } catch (RuntimeException e) {
                opened.close();
                throw e;
            }
            dataSource = opened;
            dsl = DSL.using(opened, SQLDialect.SQLITE);
            if (problem != null) log.info("로그 저장소를 다시 열었습니다: {}", file);
            problem = null;
            return Optional.of(dsl);
        } catch (IOException | RuntimeException e) {
            failed(e);
            return Optional.empty();
        }
    }

    /** Marks the store failing; the first failure of a run is logged once, as a warning this module never records. */
    synchronized void failed(Exception cause) {
        Instant now = clock.instant();
        if (problem == null) log.warn("로그 저장소를 쓸 수 없습니다: {}", file, cause);
        problem = new Problem(problem == null ? now : problem.since(), now, String.valueOf(cause.getMessage()));
        if (dataSource != null) {
            dataSource.close();
            dataSource = null;
            dsl = null;
        }
    }

    /** Records that could not be written since the server started. */
    void lose(int count) {
        lost.addAndGet(count);
    }

    /** Opens and migrates the database as the server starts; a failure only marks the store failing. */
    @PostConstruct
    void open() {
        dsl();
    }

    /** Where the database file is. */
    public Path file() {
        return file;
    }

    @Override
    public Status status() {
        var current = problem;
        long bytes = sizeOf(file) + sizeOf(Path.of(file + "-wal"));
        return current == null
                ? new Status(true, null, null, lost.get(), bytes)
                : new Status(false, current.since(), current.message(), lost.get(), bytes);
    }

    private static long sizeOf(Path path) {
        try {
            return Files.exists(path) ? Files.size(path) : 0;
        } catch (IOException e) {
            return 0;
        }
    }

    @PreDestroy
    synchronized void close() {
        if (dataSource != null) dataSource.close();
    }
}

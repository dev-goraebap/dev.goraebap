package xyz.goraebap.cowork.module.system.infrastructure;

import static xyz.goraebap.cowork.jooq.logs.Tables.ACTIVITY;
import static xyz.goraebap.cowork.jooq.logs.Tables.LOG_BACKUP;
import static xyz.goraebap.cowork.jooq.logs.Tables.REQUEST_HOUR;
import static xyz.goraebap.cowork.jooq.logs.Tables.SCREEN_VISIT;
import static xyz.goraebap.cowork.jooq.logs.Tables.SERVER_ERROR;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import xyz.goraebap.cowork.shared.storage.ObjectStorage;

/**
 * Keeps the log database to its last 30 days, and copies it to object storage (log-backups/2026-10-11.db) keeping the
 * last five copies. A copy that fails is recorded with its reason; neither ever throws, so neither can stop the
 * server. {@link LogMaintenanceScheduler} runs them; tests call them directly.
 */
@Component
@RequiredArgsConstructor
public class LogMaintenance {
    static final Duration KEPT = Duration.ofDays(30);
    private static final int COPIES_KEPT = 5;
    private static final String FOLDER = "log-backups/";
    private static final String TYPE = "application/vnd.sqlite3";
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final LogDatabase database;
    private final ObjectStorage storage;
    private final Clock clock;

    /** Drops what is older than 30 days. */
    public void forget() {
        var before = clock.instant().minus(KEPT);
        database.dsl().ifPresent(dsl -> {
            try {
                dsl.deleteFrom(ACTIVITY).where(ACTIVITY.AT.lt(before)).execute();
                dsl.deleteFrom(REQUEST_HOUR).where(REQUEST_HOUR.HOUR.lt(before)).execute();
                dsl.deleteFrom(SERVER_ERROR)
                        .where(SERVER_ERROR.LAST_AT.lt(before))
                        .execute();
                dsl.deleteFrom(SCREEN_VISIT)
                        .where(SCREEN_VISIT.LAST_AT.lt(before))
                        .execute();
                dsl.deleteFrom(LOG_BACKUP).where(LOG_BACKUP.AT.lt(before)).execute();
            } catch (RuntimeException e) {
                database.failed(e);
            }
        });
    }

    /** Copies the database to object storage under today's date, then drops the copy of five weeks ago. */
    public void backUp() {
        database.dsl().ifPresent(dsl -> {
            LocalDate today = LocalDate.now(clock.withZone(SEOUL));
            String key = FOLDER + today + ".db";
            Path copy = null;
            try {
                copy = Files.createTempFile("logs-", ".db");
                Files.delete(copy);
                // A consistent copy while writes go on, without the free pages.
                String target = copy.toString();
                dsl.connection(connection -> {
                    try (var statement = connection.prepareStatement("VACUUM INTO ?")) {
                        statement.setString(1, target);
                        statement.execute();
                    }
                });
                long bytes = Files.size(copy);
                storage.store(key, copy, TYPE);
                storage.delete(FOLDER + today.minusWeeks(COPIES_KEPT) + ".db");
                dsl.insertInto(LOG_BACKUP)
                        .set(LOG_BACKUP.AT, clock.instant())
                        .set(LOG_BACKUP.OBJECT_KEY, key)
                        .set(LOG_BACKUP.BYTES, (int) Math.min(Integer.MAX_VALUE, bytes))
                        .execute();
            } catch (IOException | RuntimeException e) {
                try {
                    dsl.insertInto(LOG_BACKUP)
                            .set(LOG_BACKUP.AT, clock.instant())
                            .set(LOG_BACKUP.ERROR, cut(String.valueOf(e.getMessage())))
                            .execute();
                } catch (RuntimeException ignored) {
                    // The store itself failing shows on the status page already.
                }
            } finally {
                if (copy != null) {
                    try {
                        Files.deleteIfExists(copy);
                    } catch (IOException ignored) {
                        // A temporary file left behind is removed with the container.
                    }
                }
            }
        });
    }

    private static String cut(String text) {
        return text.length() <= 500 ? text : text.substring(0, 500);
    }
}

package xyz.goraebap.module.foundation.system.infrastructure;

import static xyz.goraebap.jooq.logs.Tables.ACTIVITY;
import static xyz.goraebap.jooq.logs.Tables.REQUEST_HOUR;
import static xyz.goraebap.jooq.logs.Tables.SCREEN_VISIT;
import static xyz.goraebap.jooq.logs.Tables.SERVER_ERROR;

import jakarta.annotation.PreDestroy;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import xyz.goraebap.module.foundation.system.domain.Activity;
import xyz.goraebap.module.foundation.system.domain.LogEntry;
import xyz.goraebap.module.foundation.system.domain.RequestSample;
import xyz.goraebap.module.foundation.system.domain.ScreenVisit;
import xyz.goraebap.module.foundation.system.domain.ServerErrorEntry;

/**
 * Every two seconds writes what the buffer holds in one transaction: activities as rows, requests added into their
 * hour, errors merged into the row of the same error in the same minute, screen visits added to the member's line for
 * that screen when its last visit was within 30 minutes (a new line otherwise). Only one flush runs at a time, so two
 * quick visits never open two lines. When the store cannot take them they are
 * counted as lost, not retried, so a failing store never piles records up in memory.
 */
@Component
@RequiredArgsConstructor
public class LogWriter {
    private static final int BATCH = 5_000;

    private final LogBuffer buffer;
    private final LogDatabase database;
    private final ServerErrorAppender appender;

    @Scheduled(fixedDelayString = "PT2S", initialDelayString = "PT2S")
    void scheduled() {
        flush();
    }

    /** Writes everything waiting now; tests call it to read what a request left. */
    public synchronized void flush() {
        appender.ensureAttached();
        for (List<LogEntry> batch = buffer.drain(BATCH); !batch.isEmpty(); batch = buffer.drain(BATCH)) {
            var dsl = database.dsl();
            if (dsl.isEmpty()) {
                database.lose(batch.size());
                continue;
            }
            try {
                var entries = batch;
                dsl.get().transaction(configuration -> write(configuration.dsl(), entries));
            } catch (RuntimeException e) {
                database.failed(e);
                database.lose(batch.size());
            }
        }
    }

    @PreDestroy
    void last() {
        flush();
    }

    private static void write(DSLContext dsl, List<LogEntry> entries) {
        var activities = entries.stream()
                .filter(Activity.class::isInstance)
                .map(Activity.class::cast)
                .map(activity -> {
                    var row = dsl.newRecord(ACTIVITY);
                    row.setAt(activity.at());
                    row.setUserId(activity.userId());
                    row.setIp(activity.ip());
                    row.setMethod(activity.method());
                    row.setRoute(activity.route());
                    row.setTarget(activity.target());
                    row.setStatus(activity.status());
                    row.setDurationMs(activity.durationMs());
                    row.setTraceId(activity.traceId());
                    row.setUserAgent(activity.userAgent());
                    return row;
                })
                .toList();
        if (!activities.isEmpty()) dsl.batchInsert(activities).execute();

        var hours = new LinkedHashMap<List<Object>, long[]>();
        entries.stream()
                .filter(RequestSample.class::isInstance)
                .map(RequestSample.class::cast)
                .forEach(sample -> {
                    long[] sum = hours.computeIfAbsent(
                            List.of(sample.hour(), sample.method(), sample.route(), sample.statusClass()),
                            key -> new long[4]);
                    sum[0]++;
                    sum[1] += sample.durationMs();
                    sum[2] = Math.max(sum[2], sample.durationMs());
                    if (sample.slow()) sum[3]++;
                });
        hours.forEach((key, sum) -> dsl.insertInto(REQUEST_HOUR)
                .set(REQUEST_HOUR.HOUR, (Instant) key.get(0))
                .set(REQUEST_HOUR.METHOD, (String) key.get(1))
                .set(REQUEST_HOUR.ROUTE, (String) key.get(2))
                .set(REQUEST_HOUR.STATUS_CLASS, (Integer) key.get(3))
                .set(REQUEST_HOUR.REQUESTS, (int) sum[0])
                .set(REQUEST_HOUR.TOTAL_MS, (int) sum[1])
                .set(REQUEST_HOUR.MAX_MS, (int) sum[2])
                .set(REQUEST_HOUR.SLOW, (int) sum[3])
                .onConflict(REQUEST_HOUR.HOUR, REQUEST_HOUR.METHOD, REQUEST_HOUR.ROUTE, REQUEST_HOUR.STATUS_CLASS)
                .doUpdate()
                .set(REQUEST_HOUR.REQUESTS, REQUEST_HOUR.REQUESTS.plus((int) sum[0]))
                .set(REQUEST_HOUR.TOTAL_MS, REQUEST_HOUR.TOTAL_MS.plus((int) sum[1]))
                .set(REQUEST_HOUR.MAX_MS, DSL.greatest(REQUEST_HOUR.MAX_MS, DSL.val((int) sum[2])))
                .set(REQUEST_HOUR.SLOW, REQUEST_HOUR.SLOW.plus((int) sum[3]))
                .execute());

        entries.stream()
                .filter(ServerErrorEntry.class::isInstance)
                .map(ServerErrorEntry.class::cast)
                .forEach(error -> dsl.insertInto(SERVER_ERROR)
                        .set(SERVER_ERROR.FINGERPRINT, error.fingerprint())
                        .set(SERVER_ERROR.MINUTE, error.minute())
                        .set(SERVER_ERROR.FIRST_AT, error.at())
                        .set(SERVER_ERROR.LAST_AT, error.at())
                        .set(SERVER_ERROR.OCCURRENCES, 1)
                        .set(SERVER_ERROR.LEVEL, error.level())
                        .set(SERVER_ERROR.LOGGER, error.logger())
                        .set(SERVER_ERROR.MESSAGE, error.message())
                        .set(SERVER_ERROR.EXCEPTION, error.exception())
                        .set(SERVER_ERROR.STACK, error.stack())
                        .set(SERVER_ERROR.TRACE_ID, error.traceId())
                        .set(SERVER_ERROR.METHOD, error.method())
                        .set(SERVER_ERROR.PATH, error.path())
                        .set(SERVER_ERROR.USER_ID, error.userId())
                        .set(SERVER_ERROR.IP, error.ip())
                        .onConflict(SERVER_ERROR.FINGERPRINT, SERVER_ERROR.MINUTE)
                        .doUpdate()
                        .set(SERVER_ERROR.OCCURRENCES, SERVER_ERROR.OCCURRENCES.plus(1))
                        .set(SERVER_ERROR.LAST_AT, error.at())
                        .execute());

        entries.stream()
                .filter(ScreenVisit.class::isInstance)
                .map(ScreenVisit.class::cast)
                .forEach(visit -> {
                    int joined = dsl.update(SCREEN_VISIT)
                            .set(SCREEN_VISIT.LAST_AT, visit.at())
                            .set(SCREEN_VISIT.VISITS, SCREEN_VISIT.VISITS.plus(1))
                            .set(SCREEN_VISIT.IP, visit.ip())
                            .where(SCREEN_VISIT.USER_ID.eq(visit.userId()))
                            .and(SCREEN_VISIT.SCREEN.eq(visit.screen()))
                            .and(SCREEN_VISIT.LAST_AT.ge(visit.joinsAfter()))
                            .execute();
                    if (joined == 0)
                        dsl.insertInto(SCREEN_VISIT)
                                .set(SCREEN_VISIT.USER_ID, visit.userId())
                                .set(SCREEN_VISIT.SCREEN, visit.screen())
                                .set(SCREEN_VISIT.IP, visit.ip())
                                .set(SCREEN_VISIT.USER_AGENT, visit.userAgent())
                                .set(SCREEN_VISIT.FIRST_AT, visit.at())
                                .set(SCREEN_VISIT.LAST_AT, visit.at())
                                .set(SCREEN_VISIT.VISITS, 1)
                                .execute();
                });
    }
}

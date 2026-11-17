package xyz.goraebap.module.foundation.system.infrastructure;

import static org.jooq.impl.DSL.max;
import static org.jooq.impl.DSL.sum;
import static org.jooq.impl.DSL.when;
import static xyz.goraebap.jooq.logs.Tables.ACTIVITY;
import static xyz.goraebap.jooq.logs.Tables.LOG_BACKUP;
import static xyz.goraebap.jooq.logs.Tables.REQUEST_HOUR;
import static xyz.goraebap.jooq.logs.Tables.SCREEN_VISIT;
import static xyz.goraebap.jooq.logs.Tables.SERVER_ERROR;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Component;
import xyz.goraebap.jooq.logs.tables.records.ServerErrorRecord;
import xyz.goraebap.module.foundation.system.application.LogQuery;
import xyz.goraebap.module.foundation.system.application.SystemErrorCode;
import xyz.goraebap.module.foundation.system.application.SystemRequests;
import xyz.goraebap.module.foundation.system.application.SystemViews;

/**
 * Reads the log database. A store that cannot be opened, or a read that fails, is SYSTEM_LOG_UNAVAILABLE; member
 * names are not here (they live in the business database) and are left null for the service to fill in.
 */
@Component
@RequiredArgsConstructor
class JooqLogQuery implements LogQuery {
    private final LogDatabase database;

    @Override
    public List<HourCount> hourCounts(Instant from, Instant to) {
        return read(dsl -> dsl.select(
                        REQUEST_HOUR.HOUR,
                        REQUEST_HOUR.STATUS_CLASS,
                        sum(REQUEST_HOUR.REQUESTS),
                        sum(REQUEST_HOUR.TOTAL_MS),
                        max(REQUEST_HOUR.MAX_MS),
                        sum(REQUEST_HOUR.SLOW))
                .from(REQUEST_HOUR)
                .where(REQUEST_HOUR.HOUR.ge(from).and(REQUEST_HOUR.HOUR.lt(to)))
                .groupBy(REQUEST_HOUR.HOUR, REQUEST_HOUR.STATUS_CLASS)
                .fetch(row -> new HourCount(
                        row.value1(),
                        row.value2(),
                        intOf(row.value3()),
                        longOf(row.value4()),
                        row.value5() == null ? 0 : row.value5(),
                        intOf(row.value6()))));
    }

    @Override
    public List<ActivityMoment> activityMoments(Instant from, Instant to) {
        return read(dsl -> {
            var moments = new ArrayList<ActivityMoment>(dsl.select(ACTIVITY.AT, ACTIVITY.USER_ID)
                    .from(ACTIVITY)
                    .where(ACTIVITY.AT.ge(from).and(ACTIVITY.AT.lt(to)))
                    .fetch(row -> new ActivityMoment(row.value1(), row.value2(), true)));
            moments.addAll(dsl.select(SCREEN_VISIT.FIRST_AT, SCREEN_VISIT.USER_ID)
                    .from(SCREEN_VISIT)
                    .where(SCREEN_VISIT.FIRST_AT.ge(from).and(SCREEN_VISIT.FIRST_AT.lt(to)))
                    .fetch(row -> new ActivityMoment(row.value1(), row.value2(), false)));
            return moments;
        });
    }

    @Override
    public List<ErrorMoment> errorMoments(Instant from, Instant to) {
        return read(dsl -> dsl.select(SERVER_ERROR.MINUTE, SERVER_ERROR.OCCURRENCES)
                .from(SERVER_ERROR)
                .where(SERVER_ERROR.LEVEL.eq("ERROR"))
                .and(SERVER_ERROR.MINUTE.ge(from).and(SERVER_ERROR.MINUTE.lt(to)))
                .fetch(row -> new ErrorMoment(row.value1(), row.value2())));
    }

    @Override
    public List<SystemViews.RouteRow> routes(Instant from, Instant to) {
        var requests = sum(REQUEST_HOUR.REQUESTS);
        return read(dsl -> dsl.select(
                        REQUEST_HOUR.METHOD,
                        REQUEST_HOUR.ROUTE,
                        requests,
                        sum(REQUEST_HOUR.TOTAL_MS),
                        max(REQUEST_HOUR.MAX_MS),
                        sum(when(REQUEST_HOUR.STATUS_CLASS.eq(5), REQUEST_HOUR.REQUESTS)
                                .else_(0)))
                .from(REQUEST_HOUR)
                .where(REQUEST_HOUR.HOUR.ge(from).and(REQUEST_HOUR.HOUR.lt(to)))
                .groupBy(REQUEST_HOUR.METHOD, REQUEST_HOUR.ROUTE)
                .fetch(row -> {
                    int count = intOf(row.value3());
                    return new SystemViews.RouteRow(
                            row.value1(),
                            row.value2(),
                            count,
                            count == 0 ? 0 : (int) (longOf(row.value4()) / count),
                            row.value5() == null ? 0 : row.value5(),
                            intOf(row.value6()));
                }));
    }

    @Override
    public List<SystemViews.ActivityRow> activities(
            Instant from, Instant to, SystemRequests.ActivityListing listing, ActivityCursor after, int limit) {
        return read(dsl -> {
            var rows = new ArrayList<SystemViews.ActivityRow>();
            if (listing.changes()) rows.addAll(changes(dsl, from, to, listing, after, limit));
            if (listing.visits()) rows.addAll(visits(dsl, from, to, listing, after, limit));
            rows.sort(NEWEST_FIRST);
            return rows.size() > limit ? List.copyOf(rows.subList(0, limit)) : rows;
        });
    }

    /** The order of the activity record: newest first, a change before a visit at the same moment, higher id first. */
    private static final Comparator<SystemViews.ActivityRow> NEWEST_FIRST = Comparator.comparing(
                    SystemViews.ActivityRow::at, Comparator.reverseOrder())
            .thenComparing(row -> row.kind().equals(SystemViews.ActivityRow.CHANGE) ? 0 : 1)
            .thenComparing(SystemViews.ActivityRow::id, Comparator.reverseOrder());

    private static List<SystemViews.ActivityRow> changes(
            DSLContext dsl,
            Instant from,
            Instant to,
            SystemRequests.ActivityListing listing,
            ActivityCursor after,
            int limit) {
        var conditions = new ArrayList<Condition>();
        conditions.add(ACTIVITY.AT.ge(from).and(ACTIVITY.AT.lt(to)));
        if (listing.userId() != null) conditions.add(ACTIVITY.USER_ID.eq(listing.userId()));
        if (listing.outcome() != null)
            conditions.add(
                    switch (listing.outcome()) {
                        case SUCCESS -> ACTIVITY.STATUS.lt(400);
                        case REFUSED -> ACTIVITY.STATUS.between(400, 499);
                        case FAILED -> ACTIVITY.STATUS.ge(500);
                    });
        if (listing.q() != null) conditions.add(ACTIVITY.ROUTE.containsIgnoreCase(listing.q()));
        // After the cursor: an earlier moment, or the same one with a lower id when the cursor was a change too.
        if (after != null)
            conditions.add(ACTIVITY.AT
                    .lt(after.at())
                    .or(
                            after.kind().equals(SystemViews.ActivityRow.CHANGE)
                                    ? ACTIVITY.AT.eq(after.at()).and(ACTIVITY.ACTIVITY_ID.lt((int) after.id()))
                                    : DSL.falseCondition()));
        return dsl.selectFrom(ACTIVITY)
                .where(conditions)
                .orderBy(ACTIVITY.AT.desc(), ACTIVITY.ACTIVITY_ID.desc())
                .limit(limit)
                .fetch(row -> new SystemViews.ActivityRow(
                        row.getActivityId(),
                        SystemViews.ActivityRow.CHANGE,
                        row.getAt(),
                        null,
                        null,
                        row.getUserId(),
                        null,
                        null,
                        row.getIp(),
                        row.getMethod(),
                        row.getRoute(),
                        row.getTarget(),
                        row.getStatus(),
                        row.getDurationMs(),
                        row.getTraceId(),
                        row.getUserAgent()));
    }

    private static List<SystemViews.ActivityRow> visits(
            DSLContext dsl,
            Instant from,
            Instant to,
            SystemRequests.ActivityListing listing,
            ActivityCursor after,
            int limit) {
        var conditions = new ArrayList<Condition>();
        conditions.add(SCREEN_VISIT.FIRST_AT.ge(from).and(SCREEN_VISIT.FIRST_AT.lt(to)));
        if (listing.userId() != null) conditions.add(SCREEN_VISIT.USER_ID.eq(listing.userId()));
        if (listing.q() != null) conditions.add(SCREEN_VISIT.SCREEN.containsIgnoreCase(listing.q()));
        // After the cursor: an earlier moment, or the same one after any change there or with a lower id.
        if (after != null)
            conditions.add(SCREEN_VISIT
                    .FIRST_AT
                    .lt(after.at())
                    .or(SCREEN_VISIT
                            .FIRST_AT
                            .eq(after.at())
                            .and(
                                    after.kind().equals(SystemViews.ActivityRow.CHANGE)
                                            ? DSL.trueCondition()
                                            : SCREEN_VISIT.SCREEN_VISIT_ID.lt((int) after.id()))));
        return dsl.selectFrom(SCREEN_VISIT)
                .where(conditions)
                .orderBy(SCREEN_VISIT.FIRST_AT.desc(), SCREEN_VISIT.SCREEN_VISIT_ID.desc())
                .limit(limit)
                .fetch(row -> new SystemViews.ActivityRow(
                        row.getScreenVisitId(),
                        SystemViews.ActivityRow.VISIT,
                        row.getFirstAt(),
                        row.getLastAt(),
                        row.getVisits(),
                        row.getUserId(),
                        null,
                        null,
                        row.getIp(),
                        null,
                        row.getScreen(),
                        null,
                        null,
                        null,
                        null,
                        row.getUserAgent()));
    }

    @Override
    public List<SystemViews.ErrorRow> errors(Instant from, Instant to, String level, Long before, int limit) {
        var conditions = new ArrayList<Condition>();
        conditions.add(SERVER_ERROR.LAST_AT.ge(from).and(SERVER_ERROR.LAST_AT.lt(to)));
        if (level != null) conditions.add(SERVER_ERROR.LEVEL.eq(level));
        if (before != null) conditions.add(SERVER_ERROR.SERVER_ERROR_ID.lt(before.intValue()));
        return read(dsl -> dsl.selectFrom(SERVER_ERROR)
                .where(conditions)
                .orderBy(SERVER_ERROR.SERVER_ERROR_ID.desc())
                .limit(limit)
                .fetch(JooqLogQuery::errorRow));
    }

    @Override
    public Optional<SystemViews.ErrorDetail> error(long id) {
        return read(dsl -> dsl.selectFrom(SERVER_ERROR)
                .where(SERVER_ERROR.SERVER_ERROR_ID.eq((int) id))
                .fetchOptional(row -> new SystemViews.ErrorDetail(errorRow(row), row.getStack())));
    }

    @Override
    public Optional<SystemViews.Backup> lastBackup() {
        return read(dsl -> dsl.selectFrom(LOG_BACKUP)
                .orderBy(LOG_BACKUP.LOG_BACKUP_ID.desc())
                .limit(1)
                .fetchOptional(row ->
                        new SystemViews.Backup(row.getAt(), row.getObjectKey(), row.getBytes(), row.getError())));
    }

    private static SystemViews.ErrorRow errorRow(ServerErrorRecord row) {
        return new SystemViews.ErrorRow(
                row.getServerErrorId(),
                row.getFirstAt(),
                row.getLastAt(),
                row.getOccurrences(),
                row.getLevel(),
                row.getLogger(),
                row.getMessage(),
                row.getException(),
                row.getTraceId(),
                row.getMethod(),
                row.getPath(),
                row.getUserId(),
                null,
                row.getIp());
    }

    private <T> T read(Function<DSLContext, T> query) {
        var dsl = database.dsl().orElseThrow(SystemErrorCode.SYSTEM_LOG_UNAVAILABLE::raise);
        try {
            return query.apply(dsl);
        } catch (org.jooq.exception.DataAccessException e) {
            throw SystemErrorCode.SYSTEM_LOG_UNAVAILABLE.raise();
        }
    }

    private static int intOf(BigDecimal value) {
        return value == null ? 0 : value.intValue();
    }

    private static long longOf(BigDecimal value) {
        return value == null ? 0 : value.longValue();
    }
}

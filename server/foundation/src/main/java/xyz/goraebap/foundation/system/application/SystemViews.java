package xyz.goraebap.foundation.system.application;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** What the system status page shows. */
public final class SystemViews {
    private SystemViews() {}

    /**
     * The server as it is now. It never depends on the log database: logStore says whether that can be read, and
     * lastBackup is null when it cannot (or before the first weekly copy).
     */
    public record Status(
            String version,
            Instant startedAt,
            long uptimeSeconds,
            Runtime runtime,
            Disk disk,
            long businessDbBytes,
            LogStore logStore,
            Backup lastBackup) {}

    /** heapUsed and heapMax in bytes; processCpu and systemCpu from 0 to 1, null when the JVM cannot tell. */
    public record Runtime(
            long heapUsed, long heapMax, Double processCpu, Double systemCpu, int processors, int threads) {}

    /** The disk the databases live on, in bytes. */
    public record Disk(long free, long total) {}

    /** Whether the log database can be written; lost counts records dropped since the server started. */
    public record LogStore(boolean ok, Instant failingSince, String problem, long lost, long bytes) {}

    /** The latest weekly copy of the log database: where it went and how big, or why it failed. */
    public record Backup(Instant at, String objectKey, Integer bytes, String error) {}

    /**
     * Traffic over the chosen range: hourly buckets for a day, Seoul days for a week or a month. clientErrors are
     * requests refused (4xx), serverErrors failures (5xx); errors counts what the server logged as errors.
     */
    public record Traffic(
            String range, Totals totals, List<Bucket> buckets, List<RouteRow> busiest, List<RouteRow> slowest) {
        public Traffic {
            buckets = List.copyOf(buckets);
            busiest = List.copyOf(busiest);
            slowest = List.copyOf(slowest);
        }
    }

    public record Totals(int requests, int serverErrors, int slow, int activities, int activeMembers, int errors) {}

    /** avgMs is null for a bucket without requests. */
    public record Bucket(
            Instant at,
            int ok,
            int clientErrors,
            int serverErrors,
            Integer avgMs,
            int maxMs,
            int slow,
            int activities,
            int activeMembers,
            int errors) {}

    /** One API mapping over the range. */
    public record RouteRow(String method, String route, int requests, int avgMs, int maxMs, int serverErrors) {}

    /**
     * One thing a member did. A CHANGE is a request that changed something or a read worth keeping: method, route (the
     * mapping), target, status, durationMs and traceId are set, lastAt and visits are null. A VISIT is a main screen
     * opened: route is the screen (/meetings), at is the first opening and lastAt the last of those within 30 minutes of
     * each other, visits how many; method, target, status, durationMs and traceId are null. userName is null before
     * sign-in or for someone no longer found.
     */
    public record ActivityRow(
            long id,
            String kind,
            Instant at,
            Instant lastAt,
            Integer visits,
            UUID userId,
            String userName,
            String affiliationName,
            String ip,
            String method,
            String route,
            String target,
            Integer status,
            Integer durationMs,
            String traceId,
            String userAgent) {
        public static final String CHANGE = "CHANGE";
        public static final String VISIT = "VISIT";

        /** The same row with the member's name and department. */
        public ActivityRow named(String name, String department) {
            return new ActivityRow(
                    id,
                    kind,
                    at,
                    lastAt,
                    visits,
                    userId,
                    name,
                    department,
                    ip,
                    method,
                    route,
                    target,
                    status,
                    durationMs,
                    traceId,
                    userAgent);
        }
    }

    /** One slice of the activity record, newest first; nextCursor is null at the end. */
    public record ActivitySlice(List<ActivityRow> items, String nextCursor) {
        public ActivitySlice {
            items = List.copyOf(items);
        }
    }

    /** One server error, the same one within a minute counted in occurrences. */
    public record ErrorRow(
            long id,
            Instant firstAt,
            Instant lastAt,
            int occurrences,
            String level,
            String logger,
            String message,
            String exception,
            String traceId,
            String method,
            String path,
            UUID userId,
            String userName,
            String ip) {}

    /** One slice of the errors, newest first; nextCursor is null at the end. */
    public record ErrorSlice(List<ErrorRow> items, String nextCursor) {
        public ErrorSlice {
            items = List.copyOf(items);
        }
    }

    /** An error with the stack it was logged with (null for one logged without an exception). */
    public record ErrorDetail(ErrorRow error, String stack) {}
}

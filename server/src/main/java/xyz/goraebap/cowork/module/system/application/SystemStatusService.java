package xyz.goraebap.cowork.module.system.application;

import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.ToIntFunction;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.cowork.module.user.UserFacade;
import xyz.goraebap.cowork.module.user.UserSummary;
import xyz.goraebap.cowork.shared.error.BusinessException;
import xyz.goraebap.cowork.shared.web.Cursor;

/**
 * The system status page: the server as it is now, traffic charts, the activity record and the server errors. Only
 * the status works without the log database; the rest answer SYSTEM_LOG_UNAVAILABLE while it cannot be read.
 */
@Service
public class SystemStatusService {
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final int PAGE = 50;
    private static final int TOP = 10;
    private static final String SORT = "id";
    private static final String ACTIVITY_SORT = "at";
    /** The records are kept this long, so a listing never reaches further back. */
    private static final Duration KEPT = Duration.ofDays(30);

    private final LogQuery logQuery;
    private final LogStoreHealth logStoreHealth;
    private final RuntimeLoad runtimeLoad;
    private final UserFacade userFacade;
    private final Clock clock;
    private final String version;
    private final Path businessDb;
    private final Instant startedAt;

    SystemStatusService(
            LogQuery logQuery,
            LogStoreHealth logStoreHealth,
            RuntimeLoad runtimeLoad,
            UserFacade userFacade,
            Clock clock,
            @Value("${app.version:local}") String version,
            @Value("${spring.datasource.url}") String databaseUrl) {
        this.logQuery = logQuery;
        this.logStoreHealth = logStoreHealth;
        this.runtimeLoad = runtimeLoad;
        this.userFacade = userFacade;
        this.clock = clock;
        this.version = version;
        this.businessDb = Path.of(databaseUrl.replaceFirst("^jdbc:sqlite:", "").replaceFirst("\\?.*$", ""))
                .toAbsolutePath();
        this.startedAt =
                Instant.ofEpochMilli(ManagementFactory.getRuntimeMXBean().getStartTime());
    }

    @Transactional(readOnly = true)
    public SystemViews.Status status() {
        var health = logStoreHealth.status();
        SystemViews.Backup backup = null;
        if (health.ok()) {
            try {
                backup = logQuery.lastBackup().orElse(null);
            } catch (BusinessException unavailable) {
                // The status stands without it; the log store's own line says why.
            }
        }
        Instant now = clock.instant();
        return new SystemViews.Status(
                version,
                startedAt,
                Duration.between(startedAt, now).toSeconds(),
                runtime(),
                disk(),
                sizeOf(businessDb) + sizeOf(Path.of(businessDb + "-wal")),
                new SystemViews.LogStore(
                        health.ok(), health.failingSince(), health.problem(), health.lost(), health.bytes()),
                backup);
    }

    @Transactional(readOnly = true)
    public SystemViews.Traffic traffic(SystemRequests.TrafficSpan query) {
        Instant now = clock.instant();
        List<Instant> starts = bucketStarts(query.range(), now);
        Instant from = starts.getFirst();
        Instant to = query.range() == SystemRequests.TrafficRange.DAY
                ? now.truncatedTo(ChronoUnit.HOURS).plus(Duration.ofHours(1))
                : now.plus(Duration.ofDays(1));
        ToIntFunction<Instant> bucketOf = at -> {
            int index = 0;
            for (int i = 0; i < starts.size(); i++) if (!starts.get(i).isAfter(at)) index = i;
            return index;
        };

        long[][] sums = new long[starts.size()][8];
        var members = new ArrayList<Set<UUID>>();
        starts.forEach(start -> members.add(new HashSet<>()));
        for (var count : logQuery.hourCounts(from, to)) {
            long[] sum = sums[bucketOf.applyAsInt(count.hour())];
            if (count.statusClass() >= 5) sum[2] += count.requests();
            else if (count.statusClass() == 4) sum[1] += count.requests();
            else sum[0] += count.requests();
            sum[3] += count.totalMs();
            sum[4] = Math.max(sum[4], count.maxMs());
            sum[5] += count.slow();
        }
        for (var activity : logQuery.activityMoments(from, to)) {
            int bucket = bucketOf.applyAsInt(activity.at());
            if (activity.change()) sums[bucket][6]++;
            if (activity.employeeId() != null) members.get(bucket).add(activity.employeeId());
        }
        for (var error : logQuery.errorMoments(from, to))
            sums[bucketOf.applyAsInt(error.minute())][7] += error.occurrences();

        var buckets = new ArrayList<SystemViews.Bucket>();
        for (int index = 0; index < starts.size(); index++) {
            long[] sum = sums[index];
            long requests = sum[0] + sum[1] + sum[2];
            buckets.add(new SystemViews.Bucket(
                    starts.get(index),
                    (int) sum[0],
                    (int) sum[1],
                    (int) sum[2],
                    requests == 0 ? null : (int) (sum[3] / requests),
                    (int) sum[4],
                    (int) sum[5],
                    (int) sum[6],
                    members.get(index).size(),
                    (int) sum[7]));
        }
        var everyone = new HashSet<UUID>();
        members.forEach(everyone::addAll);
        var totals = new SystemViews.Totals(
                buckets.stream()
                        .mapToInt(b -> b.ok() + b.clientErrors() + b.serverErrors())
                        .sum(),
                buckets.stream().mapToInt(SystemViews.Bucket::serverErrors).sum(),
                buckets.stream().mapToInt(SystemViews.Bucket::slow).sum(),
                buckets.stream().mapToInt(SystemViews.Bucket::activities).sum(),
                everyone.size(),
                buckets.stream().mapToInt(SystemViews.Bucket::errors).sum());

        var routes = logQuery.routes(from, to);
        var busiest = routes.stream()
                .sorted(Comparator.comparingInt(SystemViews.RouteRow::requests).reversed())
                .limit(TOP)
                .toList();
        var slowest = routes.stream()
                .sorted(Comparator.comparingInt(SystemViews.RouteRow::avgMs).reversed())
                .limit(TOP)
                .toList();
        return new SystemViews.Traffic(query.range().name(), totals, buckets, busiest, slowest);
    }

    @Transactional(readOnly = true)
    public SystemViews.ActivitySlice activities(SystemRequests.ActivityListing listing) {
        LogQuery.ActivityCursor after = null;
        if (listing.cursor() != null) {
            var values = Cursor.decode(listing.cursor(), ACTIVITY_SORT, 3);
            try {
                after = new LogQuery.ActivityCursor(
                        Instant.parse(values.get(0)), values.get(1), Long.parseLong(values.get(2)));
            } catch (RuntimeException e) {
                throw Cursor.invalid();
            }
        }
        var rows = logQuery.activities(start(listing.from()), end(listing.to()), listing, after, PAGE + 1);
        var page = rows.stream().limit(PAGE).toList();
        var names = namesOf(page.stream().map(SystemViews.ActivityRow::employeeId));
        var items = page.stream()
                .map(row -> {
                    UserSummary who = row.employeeId() == null ? null : names.get(row.employeeId());
                    return who == null ? row : row.named(who.name());
                })
                .toList();
        String next = null;
        if (rows.size() > PAGE) {
            var last = page.getLast();
            next = Cursor.encode(ACTIVITY_SORT, last.at().toString(), last.kind(), String.valueOf(last.id()));
        }
        return new SystemViews.ActivitySlice(items, next);
    }

    @Transactional(readOnly = true)
    public SystemViews.ErrorSlice errors(SystemRequests.ErrorListing listing) {
        Long before = listing.cursor() == null
                ? null
                : Long.valueOf(Cursor.decode(listing.cursor(), SORT, 1).getFirst());
        var rows = logQuery.errors(start(listing.from()), end(listing.to()), listing.level(), before, PAGE + 1);
        var page = rows.stream().limit(PAGE).toList();
        var names = namesOf(page.stream().map(SystemViews.ErrorRow::employeeId));
        String next = rows.size() > PAGE
                ? Cursor.encode(SORT, String.valueOf(page.getLast().id()))
                : null;
        return new SystemViews.ErrorSlice(
                page.stream().map(row -> named(row, names)).toList(), next);
    }

    @Transactional(readOnly = true)
    public SystemViews.ErrorDetail error(long id) {
        var detail = logQuery.error(id).orElseThrow(SystemErrorCode.SYSTEM_ERROR_NOT_FOUND::raise);
        var names = namesOf(Stream.of(detail.error().employeeId()));
        return new SystemViews.ErrorDetail(named(detail.error(), names), detail.stack());
    }

    private Map<UUID, UserSummary> namesOf(Stream<UUID> ids) {
        return userFacade.summariesOf(ids.filter(Objects::nonNull).toList());
    }

    private static SystemViews.ErrorRow named(SystemViews.ErrorRow row, Map<UUID, UserSummary> names) {
        UserSummary who = row.employeeId() == null ? null : names.get(row.employeeId());
        return new SystemViews.ErrorRow(
                row.id(),
                row.firstAt(),
                row.lastAt(),
                row.occurrences(),
                row.level(),
                row.logger(),
                row.message(),
                row.exception(),
                row.traceId(),
                row.method(),
                row.path(),
                row.employeeId(),
                who == null ? null : who.name(),
                row.ip());
    }

    /** The start of from's Seoul day, or 30 days back when no day is given. */
    private Instant start(LocalDate from) {
        return from == null
                ? clock.instant().minus(KEPT)
                : from.atStartOfDay(SEOUL).toInstant();
    }

    /** The end of to's Seoul day, or now and a little after when no day is given. */
    private Instant end(LocalDate to) {
        return to == null
                ? clock.instant().plus(Duration.ofDays(1))
                : to.plusDays(1).atStartOfDay(SEOUL).toInstant();
    }

    /** Hours of the last day (the current one last), or Seoul days of the last week or month (today last). */
    private static List<Instant> bucketStarts(SystemRequests.TrafficRange range, Instant now) {
        var starts = new ArrayList<Instant>();
        if (range == SystemRequests.TrafficRange.DAY) {
            Instant hour = now.truncatedTo(ChronoUnit.HOURS);
            for (int back = 23; back >= 0; back--) starts.add(hour.minus(Duration.ofHours(back)));
            return starts;
        }
        int days = range == SystemRequests.TrafficRange.WEEK ? 7 : 30;
        LocalDate today = LocalDate.ofInstant(now, SEOUL);
        for (int back = days - 1; back >= 0; back--)
            starts.add(today.minusDays(back).atStartOfDay(SEOUL).toInstant());
        return starts;
    }

    private SystemViews.Runtime runtime() {
        var memory = ManagementFactory.getMemoryMXBean().getHeapMemoryUsage();
        return new SystemViews.Runtime(
                memory.getUsed(),
                memory.getMax(),
                runtimeLoad.processCpu(),
                runtimeLoad.systemCpu(),
                Runtime.getRuntime().availableProcessors(),
                ManagementFactory.getThreadMXBean().getThreadCount());
    }

    private SystemViews.Disk disk() {
        try {
            Path existing = Files.exists(businessDb) ? businessDb : businessDb.getParent();
            if (existing == null) return new SystemViews.Disk(0, 0);
            var store = Files.getFileStore(existing);
            return new SystemViews.Disk(store.getUsableSpace(), store.getTotalSpace());
        } catch (IOException | RuntimeException e) {
            return new SystemViews.Disk(0, 0);
        }
    }

    private static long sizeOf(Path path) {
        try {
            return Files.exists(path) ? Files.size(path) : 0;
        } catch (IOException e) {
            return 0;
        }
    }
}

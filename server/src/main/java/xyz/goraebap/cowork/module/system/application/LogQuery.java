package xyz.goraebap.cowork.module.system.application;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Reads the log database. Every method raises SYSTEM_LOG_UNAVAILABLE when the store cannot be read, so the page says
 * so instead of failing.
 */
public interface LogQuery {

    /** Requests of one hour and status class, summed over the mappings. */
    record HourCount(Instant hour, int statusClass, int requests, long totalMs, int maxMs, int slow) {}

    /**
     * An activity's moment and member, for counting activity and active members per bucket; change is false for a
     * screen visit, which counts its member but not as an activity.
     */
    record ActivityMoment(Instant at, UUID employeeId, boolean change) {}

    /** Errors logged in one minute. */
    record ErrorMoment(Instant minute, int occurrences) {}

    List<HourCount> hourCounts(Instant from, Instant to);

    List<ActivityMoment> activityMoments(Instant from, Instant to);

    List<ErrorMoment> errorMoments(Instant from, Instant to);

    /** Every mapping over the range, summed. */
    List<SystemViews.RouteRow> routes(Instant from, Instant to);

    /** Where an activity slice stopped: the last row's moment, kind and id. */
    record ActivityCursor(Instant at, String kind, long id) {}

    /**
     * Up to limit activities from the newest, changes and visits together by their moment (a visit's first opening),
     * a change before a visit at the same moment, then the higher id first; after (null for the start) is where the
     * previous slice stopped.
     */
    List<SystemViews.ActivityRow> activities(
            Instant from, Instant to, SystemRequests.ActivityListing listing, ActivityCursor after, int limit);

    List<SystemViews.ErrorRow> errors(Instant from, Instant to, String level, Long before, int limit);

    Optional<SystemViews.ErrorDetail> error(long id);

    Optional<SystemViews.Backup> lastBackup();
}

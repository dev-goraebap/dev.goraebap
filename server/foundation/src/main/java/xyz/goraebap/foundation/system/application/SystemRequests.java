package xyz.goraebap.foundation.system.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

/** What the system status page asks for. */
public final class SystemRequests {
    private SystemRequests() {}

    /** DAY is the last 24 hours by hour, WEEK and MONTH the last 7 and 30 Seoul days by day. */
    public enum TrafficRange {
        DAY,
        WEEK,
        MONTH
    }

    /** CHANGE is a change or a read worth keeping, VISIT a main screen opened. */
    public enum ActivityKind {
        CHANGE,
        VISIT
    }

    /** SUCCESS is 2xx and 3xx, REFUSED 4xx, FAILED 5xx; only changes have an outcome. */
    public enum Outcome {
        SUCCESS,
        REFUSED,
        FAILED
    }

    public record TrafficSpan(TrafficRange range) {
        public TrafficSpan {
            range = range == null ? TrafficRange.DAY : range;
        }
    }

    /**
     * Activities from and to (Seoul days, both included; a visit by its first opening), of one member, of one kind,
     * ending one way (changes only, so it leaves visits out), or whose mapping or screen contains q (meetings, /tag);
     * cursor is the nextCursor of the previous slice.
     */
    public record ActivityListing(
            UUID userId,
            LocalDate from,
            LocalDate to,
            ActivityKind kind,
            Outcome outcome,
            @Size(max = 100) String q,
            @Size(max = 200) String cursor) {
        public ActivityListing {
            q = q == null || q.isBlank() ? null : q.strip();
            cursor = cursor == null || cursor.isBlank() ? null : cursor;
        }

        /** Whether changes are asked for. */
        public boolean changes() {
            return kind != ActivityKind.VISIT;
        }

        /** Whether visits are asked for: an outcome is a change's alone. */
        public boolean visits() {
            return kind != ActivityKind.CHANGE && outcome == null;
        }
    }

    /** A main screen a member opened, by its path (/meetings, /admin/members). */
    public record ScreenVisitReport(
            @NotBlank @Size(max = 100) @Pattern(regexp = "^/[a-z0-9/-]*$") String screen) {}

    /** Errors last seen from and to (Seoul days, both included), of one level (ERROR, WARN) or both. */
    public record ErrorListing(
            LocalDate from,
            LocalDate to,
            @Size(max = 5) String level,
            @Size(max = 200) String cursor) {
        public ErrorListing {
            level = level == null || level.isBlank() ? null : level;
            cursor = cursor == null || cursor.isBlank() ? null : cursor;
        }
    }
}

package xyz.goraebap.foundation.system.domain;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/** A request to the API, counted into its hour for the traffic and response time charts. */
public record RequestSample(Instant at, String method, String route, int status, int durationMs) implements LogEntry {
    /** A request that took this long or longer counts as slow. */
    public static final Duration SLOW = Duration.ofSeconds(1);

    public Instant hour() {
        return at.truncatedTo(ChronoUnit.HOURS);
    }

    /** 2 for success, 3 for a redirect, 4 for a request the server refused, 5 for a server failure. */
    public int statusClass() {
        return Math.clamp(status / 100, 1, 5);
    }

    public boolean slow() {
        return durationMs >= SLOW.toMillis();
    }
}

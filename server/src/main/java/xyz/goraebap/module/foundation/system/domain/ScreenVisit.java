package xyz.goraebap.module.foundation.system.domain;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/** A member opening one of the main screens (screen is its path, /meetings), from where and on what browser. */
public record ScreenVisit(Instant at, UUID userId, String screen, String ip, String userAgent) implements LogEntry {
    /** Opening the same screen again within this long of the last time counts on the same line. */
    public static final Duration SAME_VISIT = Duration.ofMinutes(30);

    /** The last visit a line may have had for this one to be added to it. */
    public Instant joinsAfter() {
        return at.minus(SAME_VISIT);
    }
}

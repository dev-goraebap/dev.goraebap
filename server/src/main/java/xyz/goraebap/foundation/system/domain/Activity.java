package xyz.goraebap.foundation.system.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * One thing a member did through the API, as the activity record keeps it: who (null before signing in), from where,
 * the mapping and its path values, how it ended and how long it took. Bodies and query strings are never part of it.
 */
public record Activity(
        Instant at,
        UUID employeeId,
        String ip,
        String method,
        String route,
        String target,
        int status,
        int durationMs,
        String traceId,
        String userAgent)
        implements LogEntry {}

package xyz.goraebap.module.foundation.system.domain;

/**
 * Something waiting to be written to the log database: an activity, a request to count, a server error, or a main
 * screen a member opened.
 */
public sealed interface LogEntry permits Activity, RequestSample, ServerErrorEntry, ScreenVisit {}

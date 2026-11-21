package xyz.goraebap.cowork.module.system.application;

import java.time.Instant;

/** Whether the log database can be written and read, for the status page. */
public interface LogStoreHealth {

    /**
     * ok, or since when and why not; lost counts records dropped since the server started (store failing or the
     * queue full); bytes is the file's size with its write-ahead log.
     */
    record Status(boolean ok, Instant failingSince, String problem, long lost, long bytes) {}

    Status status();
}

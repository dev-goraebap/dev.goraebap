package xyz.goraebap.module.foundation.seed.domain;

import java.time.Instant;

/**
 * A seed file brought in: its name in the seed folder, the SHA-256 of its bytes then, when, and what was made. A file
 * with a record is not brought in again, even when it has changed since.
 */
public record SeedImport(String fileName, String checksum, Instant importedAt, String summary) {
    public static final int SUMMARY_MAX = 1000;

    public SeedImport {
        if (summary != null && summary.length() > SUMMARY_MAX) summary = summary.substring(0, SUMMARY_MAX);
    }
}

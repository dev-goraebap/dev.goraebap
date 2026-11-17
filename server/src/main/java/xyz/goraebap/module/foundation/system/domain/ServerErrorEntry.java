package xyz.goraebap.module.foundation.system.domain;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

/**
 * A server error or warning as the server logged it, with the request it happened in when there was one (method,
 * path, member, address; all null for a scheduled job).
 */
public record ServerErrorEntry(
        Instant at,
        String level,
        String logger,
        String message,
        String exception,
        String stack,
        String traceId,
        String method,
        String path,
        UUID userId,
        String ip)
        implements LogEntry {

    public Instant minute() {
        return at.truncatedTo(ChronoUnit.MINUTES);
    }

    /**
     * What makes two of them the same error: the logger, the exception and the message with its numbers taken out
     * (ids, counts and times differ between occurrences of one fault).
     */
    public String fingerprint() {
        String key = logger + '\n' + exception + '\n' + message.replaceAll("[0-9a-fA-F-]{8,}|\\d+", "#");
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(key.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest, 0, 16);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}

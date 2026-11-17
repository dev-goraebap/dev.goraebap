package xyz.goraebap.module.foundation.file.application;

import java.net.URI;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public final class FileViews {
    private FileViews() {}

    /**
     * Where to send the bytes: the browser sends the file with method to url, setting headers, before expiresAt.
     * id is what the owning command, such as submitting a request, takes to bind the file.
     */
    public record UploadTicket(UUID id, URI url, String method, Map<String, String> headers, Instant expiresAt) {
        public UploadTicket {
            headers = Map.copyOf(headers);
        }
    }

    /** A stored file as the query reads it. */
    public record StoredFile(
            UUID id,
            UUID ownerId,
            String filename,
            String contentType,
            long size,
            String storageKey,
            String dominantColor,
            Integer width,
            Integer height) {}
}

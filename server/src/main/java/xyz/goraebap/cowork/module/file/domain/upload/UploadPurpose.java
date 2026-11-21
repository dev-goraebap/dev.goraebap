package xyz.goraebap.cowork.module.file.domain.upload;

/**
 * What an upload is for, which decides the formats and size it may have: evidence, pictures and a body's files up to
 * 10MB, a meeting recording up to 500MB, a profile picture the browser has already cut to a small square JPEG, or a
 * project wiki file up to 50MB. Evidence takes every format but a recording (2026-11-10: slides, archives, plain text
 * and HTML too, so a body can hold them); the browser shows an HTML file only inside a sandboxed frame.
 */
public enum UploadPurpose {
    EVIDENCE(10L * 1024 * 1024, "10MB"),
    AUDIO(500L * 1024 * 1024, "500MB"),
    AVATAR(1024L * 1024, "1MB"),
    WIKI(50L * 1024 * 1024, "50MB");

    private final long maxBytes;
    private final String limitText;

    UploadPurpose(long maxBytes, String limitText) {
        this.maxBytes = maxBytes;
        this.limitText = limitText;
    }

    public long maxBytes() {
        return maxBytes;
    }

    public String limitText() {
        return limitText;
    }

    /** Whether the format may be sent for this purpose. */
    public boolean accepts(FileFormat format) {
        return switch (this) {
            case EVIDENCE, WIKI -> !format.audio();
            case AUDIO -> format.audio();
            case AVATAR -> format == FileFormat.JPEG;
        };
    }
}

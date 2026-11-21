package xyz.goraebap.foundation.file.domain.upload;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.shared.error.DomainRuleViolation;

/**
 * A file a member is sending to storage before it belongs to anything. It becomes an attachment when the owning
 * command, such as submitting a request, takes it; one nobody takes within KEPT is removed with its bytes.
 */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(staticName = "fromPersistence")
public class PendingUpload {
    public static final int FILENAME_MAX = 256;
    /** How long an upload waits for its owner before cleanup removes it. */
    public static final Duration KEPT = Duration.ofDays(1);

    @EqualsAndHashCode.Include
    private final UUID id;

    private final UUID blobId;
    private final UUID uploaderId;
    private final String filename;
    private final FileFormat format;
    private final long size;
    private final String storageKey;
    private final Instant createdAt;
    /** How the picture looks, as the browser measured it; empty for other files. */
    private final ImageTraits traits;

    public static PendingUpload create(String filename, long size, UUID uploaderId, Instant now) {
        return create(filename, size, uploaderId, now, UploadPurpose.EVIDENCE, ImageTraits.NONE);
    }

    /** An upload whose format and size must suit its purpose, such as evidence or a meeting recording. */
    public static PendingUpload create(
            String filename, long size, UUID uploaderId, Instant now, UploadPurpose purpose, ImageTraits traits) {
        String name = validFilename(filename);
        FileFormat format = FileFormat.ofFilename(name)
                .filter(purpose::accepts)
                .orElseThrow(() -> new DomainRuleViolation("올릴 수 없는 파일 형식입니다"));
        if (size <= 0) throw new DomainRuleViolation("빈 파일은 올릴 수 없습니다");
        if (size > purpose.maxBytes()) throw new DomainRuleViolation("파일은 " + purpose.limitText() + "까지 올릴 수 있습니다");
        UUID blobId = UUID.randomUUID();
        var month = now.atZone(ZoneOffset.UTC);
        String key =
                "uploads/%d/%02d/%s.%s".formatted(month.getYear(), month.getMonthValue(), blobId, format.extension());
        return new PendingUpload(
                UUID.randomUUID(),
                blobId,
                uploaderId,
                name,
                format,
                size,
                key,
                now,
                format.image() ? traits : ImageTraits.NONE);
    }

    public boolean uploadedBy(UUID memberId) {
        return uploaderId.equals(memberId);
    }

    public boolean expired(Instant now) {
        return !createdAt.plus(KEPT).isAfter(now);
    }

    private static String validFilename(String raw) {
        if (raw == null || raw.isBlank()) throw new DomainRuleViolation("파일 이름이 필요합니다");
        // Keep only the last path segment some browsers send, and drop control characters.
        String name = raw.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1)
                .replaceAll("\\p{Cntrl}", "")
                .trim();
        if (name.isEmpty() || name.length() > FILENAME_MAX)
            throw new DomainRuleViolation("파일 이름은 1~" + FILENAME_MAX + "자여야 합니다");
        return name;
    }
}

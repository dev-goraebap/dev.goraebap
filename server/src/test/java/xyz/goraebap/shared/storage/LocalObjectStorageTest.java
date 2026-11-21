package xyz.goraebap.shared.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.web.util.UriComponentsBuilder;

class LocalObjectStorageTest {
    private static final Instant NOW = Instant.parse("2026-10-02T03:00:00Z");
    private static final byte[] BODY = "%PDF-1.7 hello".getBytes(StandardCharsets.UTF_8);

    @TempDir
    Path root;

    private LocalObjectStorage storage(Instant at) {
        return new LocalObjectStorage(root, "test-secret", Clock.fixed(at, ZoneOffset.UTC));
    }

    /** The query as the servlet hands it to the controller: decoded, one value per name. */
    private static Map<String, String> params(URI url) {
        return UriComponentsBuilder.fromUri(url).build(true).getQueryParams().toSingleValueMap().entrySet().stream()
                .collect(java.util.stream.Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> java.net.URLDecoder.decode(entry.getValue(), StandardCharsets.UTF_8)));
    }

    @Test
    void anUploadedFileOpensUnderItsNameWithTheURLsItWasGiven() {
        var storage = storage(NOW);
        var upload = storage.presignUpload("evidence/a b.pdf", "application/pdf", BODY.length, Duration.ofMinutes(5));
        storage.put(params(upload.url()), "application/pdf", BODY.length, new ByteArrayInputStream(BODY));

        assertThat(storage.find("evidence/a b.pdf"))
                .contains(new ObjectStorage.StoredObject(BODY.length, "application/pdf"));
        var download = storage.get(params(storage.presignDownload(
                "evidence/a b.pdf", "진단서 1.pdf", "application/pdf", true, Duration.ofMinutes(5))));
        assertThat(download.disposition()).startsWith("attachment; filename*=UTF-8''");
        assertThat(storage.readStart("evidence/a b.pdf", 4)).isEqualTo("%PDF".getBytes(StandardCharsets.UTF_8));

        storage.delete("evidence/a b.pdf");
        assertThat(storage.find("evidence/a b.pdf")).isEmpty();
    }

    @Test
    void aURLDoesOnlyWhatItWasSignedForAndOnlyUntilItExpires() throws Exception {
        var upload = storage(NOW).presignUpload("k", "application/pdf", BODY.length, Duration.ofMinutes(5));
        Map<String, String> params = params(upload.url());

        assertThatThrownBy(() -> storage(NOW).put(params, "image/png", BODY.length, new ByteArrayInputStream(BODY)))
                .isInstanceOf(LocalObjectStorage.Refused.class);
        var altered = new java.util.HashMap<>(params);
        altered.put("key", "other");
        assertThatThrownBy(
                        () -> storage(NOW).put(altered, "application/pdf", BODY.length, new ByteArrayInputStream(BODY)))
                .isInstanceOf(LocalObjectStorage.Refused.class);
        assertThatThrownBy(() -> storage(NOW.plus(Duration.ofMinutes(6)))
                        .put(params, "application/pdf", BODY.length, new ByteArrayInputStream(BODY)))
                .isInstanceOf(LocalObjectStorage.Refused.class);
        assertThat(Files.list(root)).isEmpty();
    }
}

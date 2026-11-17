package xyz.goraebap.shared.storage;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

class S3ObjectStorageTest {
    private static S3Presigner presigner() {
        return S3Presigner.builder()
                .endpointOverride(URI.create("https://storage.example.test"))
                .region(Region.of("auto"))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create("key", "secret")))
                .serviceConfiguration(
                        S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }

    @Test
    void keysGoUnderTheEnvironmentsFolderOfASharedBucket() {
        try (var presigner = presigner()) {
            var storage = new S3ObjectStorage(null, presigner, "files", "files/dev/");
            assertThat(storage.presignUpload("evidence/a.pdf", "application/pdf", 10, Duration.ofMinutes(5))
                            .url()
                            .getPath())
                    .isEqualTo("/files/files/dev/evidence/a.pdf");
            assertThat(storage.presignDownload(
                                    "evidence/a.pdf", "a.pdf", "application/pdf", false, Duration.ofMinutes(5))
                            .getPath())
                    .isEqualTo("/files/files/dev/evidence/a.pdf");
        }
    }

    @Test
    void aBucketOfItsOwnKeepsTheKeyAsItIs() {
        try (var presigner = presigner()) {
            var storage = new S3ObjectStorage(null, presigner, "files", null);
            assertThat(storage.presignDownload(
                                    "evidence/a.pdf", "a.pdf", "application/pdf", true, Duration.ofMinutes(5))
                            .getPath())
                    .isEqualTo("/files/evidence/a.pdf");
        }
    }
}

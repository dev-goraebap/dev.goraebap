package xyz.goraebap.foundation.shared.storage;

import java.time.Clock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * R2 (S3) when app.storage.endpoint is set, as in dev and prod; otherwise files on this machine, so a local run needs
 * no storage service and no keys. For S3, path-style addressing keeps one host for every bucket, and checksums are
 * only sent when an operation requires them, since S3-compatible services differ in which ones they accept.
 */
@Configuration
public class StorageConfig {

    @Bean
    ObjectStorage objectStorage(StorageProperties properties, @Value("${app.auth.secret}") String secret, Clock clock) {
        if (!properties.s3()) return new LocalObjectStorage(properties.localRoot(), secret, clock);
        var credentials = StaticCredentialsProvider.create(
                AwsBasicCredentials.create(properties.accessKey(), properties.secretKey()));
        var pathStyle = S3Configuration.builder().pathStyleAccessEnabled(true).build();
        var client = S3Client.builder()
                .endpointOverride(properties.endpoint())
                .region(Region.of(properties.region()))
                .credentialsProvider(credentials)
                .serviceConfiguration(pathStyle)
                .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
                .build();
        var presigner = S3Presigner.builder()
                .endpointOverride(
                        properties.publicEndpoint() == null ? properties.endpoint() : properties.publicEndpoint())
                .region(Region.of(properties.region()))
                .credentialsProvider(credentials)
                .serviceConfiguration(pathStyle)
                .build();
        return new S3ObjectStorage(client, presigner, properties.bucket(), properties.keyPrefix());
    }
}

package xyz.goraebap.foundation.shared.storage;

import java.net.URI;
import java.nio.file.Path;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Private object storage: S3-compatible when endpoint is set (R2 in dev and prod), otherwise files under localRoot on
 * this machine (local runs and tests). For S3, publicEndpoint is where browsers reach presigned URLs and may differ
 * from the endpoint the server uses, for example behind a proxy. keyPrefix is the folder of the bucket this environment keeps
 * its objects in (dev/ in a bucket shared by environments); stored keys leave it out.
 */
@ConfigurationProperties("app.storage")
public record StorageProperties(
        URI endpoint,
        URI publicEndpoint,
        String region,
        String bucket,
        String accessKey,
        String secretKey,
        String keyPrefix,
        Path localRoot) {

    public boolean s3() {
        return endpoint != null && !endpoint.toString().isBlank();
    }
}

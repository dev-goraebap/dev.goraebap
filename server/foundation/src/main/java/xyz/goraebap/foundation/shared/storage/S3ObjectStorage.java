package xyz.goraebap.foundation.shared.storage;

import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.sync.ResponseTransformer;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * ObjectStorage on an S3-compatible service; the presigner uses the endpoint browsers reach. Every key is put under
 * the environment's prefix in the bucket, so the keys the modules store stay the same in any environment.
 */
public class S3ObjectStorage implements ObjectStorage, AutoCloseable {
    /** Headers the browser sets itself and refuses to take from scripts. */
    private static final Set<String> BROWSER_HEADERS = Set.of("host", "content-length");

    private final S3Client client;
    private final S3Presigner presigner;
    private final String bucket;
    private final String prefix;

    public S3ObjectStorage(S3Client client, S3Presigner presigner, String bucket, String prefix) {
        this.client = client;
        this.presigner = presigner;
        this.bucket = bucket;
        this.prefix = prefix == null ? "" : prefix;
    }

    @Override
    public void close() {
        presigner.close();
        client.close();
    }

    private String at(String key) {
        return prefix + key;
    }

    @Override
    public PresignedUpload presignUpload(String key, String contentType, long size, Duration ttl) {
        // Signing the type and length makes the storage refuse a different body than the one declared.
        var presigned = presigner.presignPutObject(request -> request.signatureDuration(ttl)
                .putObjectRequest(PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(at(key))
                        .contentType(contentType)
                        .contentLength(size)
                        .build()));
        Map<String, String> headers = new LinkedHashMap<>();
        presigned.signedHeaders().forEach((name, values) -> {
            if (!BROWSER_HEADERS.contains(name.toLowerCase(Locale.ROOT)) && !values.isEmpty())
                headers.put(name, values.get(0));
        });
        return new PresignedUpload(
                URI.create(presigned.url().toString()),
                presigned.httpRequest().method().name(),
                headers,
                presigned.expiration());
    }

    @Override
    public URI presignDownload(String key, String filename, String contentType, boolean download, Duration ttl) {
        String encoded = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");
        String disposition = (download ? "attachment" : "inline") + "; filename*=UTF-8''" + encoded;
        var presigned = presigner.presignGetObject(request -> request.signatureDuration(ttl)
                .getObjectRequest(GetObjectRequest.builder()
                        .bucket(bucket)
                        .key(at(key))
                        .responseContentType(contentType)
                        .responseContentDisposition(disposition)
                        .build()));
        return URI.create(presigned.url().toString());
    }

    @Override
    public Optional<StoredObject> find(String key) {
        try {
            var head = client.headObject(
                    HeadObjectRequest.builder().bucket(bucket).key(at(key)).build());
            return Optional.of(new StoredObject(head.contentLength(), head.contentType()));
        } catch (NoSuchKeyException e) {
            return Optional.empty();
        } catch (S3Exception e) {
            if (e.statusCode() == 404) return Optional.empty();
            throw e;
        }
    }

    @Override
    public byte[] readStart(String key, int length) {
        return client.getObject(
                        GetObjectRequest.builder()
                                .bucket(bucket)
                                .key(at(key))
                                .range("bytes=0-" + (length - 1))
                                .build(),
                        ResponseTransformer.toBytes())
                .asByteArray();
    }

    @Override
    public InputStream open(String key) {
        return client.getObject(
                GetObjectRequest.builder().bucket(bucket).key(at(key)).build());
    }

    @Override
    public void delete(String key) {
        client.deleteObject(request -> request.bucket(bucket).key(at(key)));
    }

    @Override
    public void store(String key, Path file, String contentType) {
        client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(at(key))
                        .contentType(contentType)
                        .build(),
                RequestBody.fromFile(file));
    }
}

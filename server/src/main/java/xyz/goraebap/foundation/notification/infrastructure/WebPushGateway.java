package xyz.goraebap.foundation.notification.infrastructure;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyPair;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;
import xyz.goraebap.foundation.notification.application.PushGateway;
import xyz.goraebap.foundation.notification.domain.push.PushSubscription;

/**
 * Web Push over HTTP: the message encrypted for the browser (RFC 8291) and posted to its push service with a VAPID
 * token (RFC 8292) signed by this service's key. The key comes from app.push.vapid-public-key and
 * app.push.vapid-private-key (URL-safe Base64 of the raw P-256 point and scalar); without both, pushing is off.
 */
@Slf4j
@Component
final class WebPushGateway implements PushGateway {
    private static final Base64.Encoder BASE64 = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODE = Base64.getUrlDecoder();
    /** How long a push service keeps a push for a device that is off: a day, after which it is stale. */
    private static final int TIME_TO_LIVE = 86_400;

    private final KeyPair vapid;
    private final String publicKey;
    private final String subject;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();
    private final JsonMapper json = JsonMapper.builder().build();
    private final HttpClient http =
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    WebPushGateway(
            @Value("${app.push.vapid-public-key:}") String publicKey,
            @Value("${app.push.vapid-private-key:}") String privateKey,
            @Value("${app.push.subject:mailto:no-reply@example.test}") String subject,
            Clock clock) {
        this.clock = clock;
        this.subject = subject;
        KeyPair keys = null;
        if (!publicKey.isBlank() && !privateKey.isBlank()) {
            try {
                keys = new KeyPair(
                        WebPushCrypto.publicKey(DECODE.decode(publicKey.strip())),
                        WebPushCrypto.privateKey(DECODE.decode(privateKey.strip())));
            } catch (GeneralSecurityException | IllegalArgumentException e) {
                throw new IllegalStateException("app.push.vapid-* is not a P-256 key pair in URL-safe Base64", e);
            }
        }
        this.vapid = keys;
        this.publicKey =
                keys == null ? null : BASE64.encodeToString(WebPushCrypto.rawPublic((ECPublicKey) keys.getPublic()));
    }

    @Override
    public boolean isConfigured() {
        return vapid != null;
    }

    @Override
    public String publicKey() {
        return publicKey;
    }

    @Override
    public PushAnswer send(PushSubscription subscription, PushMessage message) {
        if (vapid == null) return new PushAnswer(0, "푸시 키가 설정되지 않았습니다", false);
        byte[] body;
        URI endpoint;
        String token;
        try {
            endpoint = URI.create(subscription.endpoint());
            byte[] salt = new byte[16];
            random.nextBytes(salt);
            body = WebPushCrypto.encrypt(
                    json.writeValueAsBytes(message),
                    DECODE.decode(subscription.p256dh()),
                    DECODE.decode(subscription.auth()),
                    WebPushCrypto.newKeyPair(),
                    salt);
            token = token(endpoint.getScheme() + "://" + endpoint.getAuthority());
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            return new PushAnswer(0, "암호화하지 못했습니다: " + e.getMessage(), false);
        }
        var request = HttpRequest.newBuilder(endpoint)
                .timeout(Duration.ofSeconds(10))
                .header("TTL", String.valueOf(TIME_TO_LIVE))
                .header("Urgency", "high")
                .header("Content-Encoding", "aes128gcm")
                .header("Content-Type", "application/octet-stream")
                .header("Authorization", "vapid t=" + token + ", k=" + publicKey)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                .build();
        try {
            var response = http.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status >= 200 && status < 300) return new PushAnswer(status, null, false);
            String reason = response.body() == null || response.body().isBlank()
                    ? "HTTP " + status
                    : response.body().strip();
            return new PushAnswer(status, reason, status == 429 || status >= 500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new PushAnswer(0, "보내는 중 멈췄습니다", true);
        } catch (Exception e) {
            log.debug("push to {} failed", endpoint.getHost(), e);
            return new PushAnswer(0, "푸시 서비스에 닿지 못했습니다: " + e.getClass().getSimpleName(), true);
        }
    }

    // The VAPID token for the push service's origin: good for 12 hours, naming whom to contact about this sender.
    private String token(String audience) throws GeneralSecurityException {
        String header = BASE64.encodeToString("{\"typ\":\"JWT\",\"alg\":\"ES256\"}".getBytes(StandardCharsets.UTF_8));
        long expires = clock.instant().plus(Duration.ofHours(12)).getEpochSecond();
        String claims =
                BASE64.encodeToString(json.writeValueAsBytes(Map.of("aud", audience, "exp", expires, "sub", subject)));
        var signer = Signature.getInstance("SHA256withECDSAinP1363Format");
        signer.initSign((ECPrivateKey) vapid.getPrivate());
        signer.update((header + "." + claims).getBytes(StandardCharsets.US_ASCII));
        return header + "." + claims + "." + BASE64.encodeToString(signer.sign());
    }
}

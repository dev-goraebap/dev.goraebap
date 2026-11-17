package xyz.goraebap.module.foundation.file.application;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Signed, expiring links for an uploaded HTML file shown inside a body (HTML 임베드). The app serves the bytes itself
 * under /api/embeds/** (HtmlEmbedController) so the response can carry the sandbox policy and be framed by our own
 * screens, which neither a presigned bucket URL nor the rest of /api/** allows. The link is the permission, as a
 * presigned URL is: whoever asked for it was authorized by the module that owns the file.
 */
@Component
public class HtmlEmbeds {
    public static final String PATH = "/api/embeds";

    /** How long a link opens the file. A frame gets a new link each time the body is read again. */
    static final Duration TTL = Duration.ofHours(1);

    /** Expiry is rounded up to this step, so links made close together are the same and the browser can cache. */
    static final Duration STEP = Duration.ofMinutes(10);

    private static final String PURPOSE = "html-embed";
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();

    private final byte[] secret;
    private final Clock clock;

    HtmlEmbeds(@Value("${app.auth.secret}") String secret, Clock clock) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.clock = clock;
    }

    /** The link that opens the stored object as a sandboxed page until it expires. */
    URI link(String storageKey) {
        long step = STEP.toSeconds();
        long expiresAt = (clock.instant().plus(TTL).getEpochSecond() / step + 1) * step;
        String key = ENCODER.encodeToString(storageKey.getBytes(StandardCharsets.UTF_8));
        return URI.create(PATH + "/" + expiresAt + "." + sign(expiresAt, key) + "/" + key);
    }

    /** The storage key a link names, when its signature is ours and it has not expired. */
    Optional<String> storageKey(String token, String key) {
        int dot = token.indexOf('.');
        if (dot <= 0) return Optional.empty();
        try {
            long expiresAt = Long.parseLong(token.substring(0, dot));
            if (expiresAt <= clock.instant().getEpochSecond()) return Optional.empty();
            if (!MessageDigest.isEqual(
                    sign(expiresAt, key).getBytes(StandardCharsets.UTF_8),
                    token.substring(dot + 1).getBytes(StandardCharsets.UTF_8))) return Optional.empty();
            return Optional.of(new String(Base64.getUrlDecoder().decode(key), StandardCharsets.UTF_8));
        } catch (IllegalArgumentException malformed) {
            return Optional.empty();
        }
    }

    private String sign(long expiresAt, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return ENCODER.encodeToString(
                    mac.doFinal((PURPOSE + "\n" + expiresAt + "\n" + key).getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException impossible) {
            throw new IllegalStateException(impossible);
        }
    }
}

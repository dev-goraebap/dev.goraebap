package xyz.goraebap.foundation.user.infrastructure;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;
import xyz.goraebap.foundation.user.application.AuthSecrets;
import xyz.goraebap.foundation.user.application.AuthSettings;

@Component
final class SecureAuthSecrets implements AuthSecrets {
    private final AuthSettings authSettings;
    private final SecureRandom random = new SecureRandom();

    SecureAuthSecrets(AuthSettings authSettings) {
        this.authSettings = authSettings;
    }

    public String token() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String code() {
        return String.format(Locale.ROOT, "%06d", random.nextInt(1_000_000));
    }

    public String hash(String purpose, String raw) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(authSettings.secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal((purpose + ":" + raw).getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("HMAC unavailable", exception);
        }
    }

    public boolean matches(String expected, String actual) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8));
    }
}

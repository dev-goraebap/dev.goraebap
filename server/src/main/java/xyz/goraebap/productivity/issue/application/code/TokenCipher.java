package xyz.goraebap.productivity.issue.application.code;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Seals repository tokens and webhook secrets before they are stored (BIT D-028): AES-256-GCM under a key drawn from
 * app.git.encryption-key (GIT_ENCRYPTION_KEY; made on first start beside the database when unset, GeneratedSecrets), a
 * fresh nonce each time. Changing the key leaves what was sealed unreadable, so connections are made again.
 */
@Component
final class TokenCipher {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int NONCE = 12;
    private final SecretKeySpec key;

    TokenCipher(@Value("${app.git.encryption-key}") String secret) {
        if (secret == null || secret.isBlank()) throw new IllegalStateException("app.git.encryption-key가 없습니다");
        try {
            this.key = new SecretKeySpec(
                    MessageDigest.getInstance("SHA-256").digest(secret.getBytes(StandardCharsets.UTF_8)), "AES");
        } catch (GeneralSecurityException impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    String seal(String plain) {
        try {
            byte[] nonce = new byte[NONCE];
            RANDOM.nextBytes(nonce);
            var cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, nonce));
            byte[] sealed = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            return "v1:"
                    + Base64.getEncoder()
                            .encodeToString(ByteBuffer.allocate(NONCE + sealed.length)
                                    .put(nonce)
                                    .put(sealed)
                                    .array());
        } catch (GeneralSecurityException failure) {
            throw new IllegalStateException("비밀값을 봉하지 못했습니다", failure);
        }
    }

    String open(String sealed) {
        if (sealed == null || !sealed.startsWith("v1:")) throw new IllegalStateException("알 수 없는 봉인 형식입니다");
        try {
            byte[] all = Base64.getDecoder().decode(sealed.substring(3));
            var cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, all, 0, NONCE));
            return new String(cipher.doFinal(all, NONCE, all.length - NONCE), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException failure) {
            throw new IllegalStateException("봉한 비밀값을 열지 못했습니다(암호화 키가 바뀌었나요?)", failure);
        }
    }

    /** A new webhook secret: 32 random bytes, URL-safe. */
    String newSecret() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}

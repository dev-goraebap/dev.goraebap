package xyz.goraebap.cowork.module.notification.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.SecureRandom;
import java.security.interfaces.ECPublicKey;
import java.util.Arrays;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;

class WebPushCryptoTest {
    private static final Base64.Decoder DECODE = Base64.getUrlDecoder();
    private static final Base64.Encoder ENCODE = Base64.getUrlEncoder().withoutPadding();
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String PLAINTEXT = "When I grow up, I want to be a watermelon";

    /** RFC 8291 Appendix A: the same keys, secret and salt give the RFC's body byte for byte. */
    @Test
    void encryptsTheRfcExampleExactly() throws Exception {
        var sender = new KeyPair(
                WebPushCrypto.publicKey(DECODE.decode(
                        "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8")),
                WebPushCrypto.privateKey(DECODE.decode("yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw")));
        byte[] body = WebPushCrypto.encrypt(
                PLAINTEXT.getBytes(StandardCharsets.UTF_8),
                DECODE.decode(
                        "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4"),
                DECODE.decode("BTBZMqHH6r4Tts7J_aSIgg"),
                sender,
                DECODE.decode("DGv6ra1nlYgDCS1FRnbzlw"));
        assertThat(ENCODE.encodeToString(body))
                .isEqualTo(
                        "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN");
    }

    /** A browser holding its private key and secret reads back what was sent, as it would on a device. */
    @Test
    void theBrowserDecryptsWhatWasSent() throws Exception {
        var browser = WebPushCrypto.newKeyPair();
        byte[] browserKey = WebPushCrypto.rawPublic((ECPublicKey) browser.getPublic());
        byte[] secret = new byte[16];
        RANDOM.nextBytes(secret);
        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);
        byte[] body = WebPushCrypto.encrypt(
                "{\"title\":\"알림\"}".getBytes(StandardCharsets.UTF_8),
                browserKey,
                secret,
                WebPushCrypto.newKeyPair(),
                salt);

        var header = ByteBuffer.wrap(body);
        byte[] readSalt = new byte[16];
        header.get(readSalt);
        assertThat(header.getInt()).isEqualTo(4096);
        byte[] senderKey = new byte[header.get()];
        header.get(senderKey);
        byte[] sealed = Arrays.copyOfRange(body, header.position(), body.length);

        var agreement = KeyAgreement.getInstance("ECDH");
        agreement.init(browser.getPrivate());
        agreement.doPhase(WebPushCrypto.publicKey(senderKey), true);
        byte[] info =
                WebPushCrypto.concat("WebPush: info\0".getBytes(StandardCharsets.US_ASCII), browserKey, senderKey);
        byte[] ikm = Arrays.copyOf(
                WebPushCrypto.hmac(
                        WebPushCrypto.hmac(secret, agreement.generateSecret()),
                        WebPushCrypto.concat(info, new byte[] {1})),
                32);
        byte[] prk = WebPushCrypto.hmac(readSalt, ikm);
        byte[] key = Arrays.copyOf(
                WebPushCrypto.hmac(prk, "Content-Encoding: aes128gcm\0\1".getBytes(StandardCharsets.US_ASCII)), 16);
        byte[] nonce = Arrays.copyOf(
                WebPushCrypto.hmac(prk, "Content-Encoding: nonce\0\1".getBytes(StandardCharsets.US_ASCII)), 12);
        var cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, nonce));
        byte[] padded = cipher.doFinal(sealed);

        assertThat(padded[padded.length - 1]).isEqualTo((byte) 2);
        assertThat(new String(padded, 0, padded.length - 1, StandardCharsets.UTF_8))
                .isEqualTo("{\"title\":\"알림\"}");
    }
}

package xyz.goraebap.cowork.module.notification.infrastructure;

import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPrivateKeySpec;
import java.security.spec.ECPublicKeySpec;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * The cryptography of Web Push on the JDK alone: P-256 keys in the raw forms browsers and VAPID use, and a message
 * encrypted for one browser as RFC 8291 says (aes128gcm, one record). Pure functions, so the RFC's own example checks
 * them.
 */
final class WebPushCrypto {
    static final ECParameterSpec P256 = p256();
    private static final int RECORD_SIZE = 4096;

    private WebPushCrypto() {}

    /** The key as a browser gives it: 0x04, then x and y of 32 bytes each. */
    static byte[] rawPublic(ECPublicKey key) {
        byte[] out = new byte[65];
        out[0] = 4;
        copyUnsigned(key.getW().getAffineX(), out, 1);
        copyUnsigned(key.getW().getAffineY(), out, 33);
        return out;
    }

    static ECPublicKey publicKey(byte[] raw) throws GeneralSecurityException {
        if (raw.length != 65 || raw[0] != 4) throw new GeneralSecurityException("not an uncompressed P-256 point");
        var point = new ECPoint(
                new BigInteger(1, Arrays.copyOfRange(raw, 1, 33)), new BigInteger(1, Arrays.copyOfRange(raw, 33, 65)));
        return (ECPublicKey) KeyFactory.getInstance("EC").generatePublic(new ECPublicKeySpec(point, P256));
    }

    static ECPrivateKey privateKey(byte[] raw) throws GeneralSecurityException {
        return (ECPrivateKey)
                KeyFactory.getInstance("EC").generatePrivate(new ECPrivateKeySpec(new BigInteger(1, raw), P256));
    }

    static KeyPair newKeyPair() throws GeneralSecurityException {
        var generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        return generator.generateKeyPair();
    }

    /**
     * The body of one push: the salt, the record size, the sender's one-time public key, then the message with its
     * closing delimiter, encrypted with the key both sides derive from the browser's key and secret.
     */
    static byte[] encrypt(byte[] plaintext, byte[] browserKey, byte[] authSecret, KeyPair oneTime, byte[] salt)
            throws GeneralSecurityException {
        var agreement = KeyAgreement.getInstance("ECDH");
        agreement.init(oneTime.getPrivate());
        agreement.doPhase(publicKey(browserKey), true);
        byte[] shared = agreement.generateSecret();
        byte[] senderKey = rawPublic((ECPublicKey) oneTime.getPublic());

        byte[] keyInfo = concat("WebPush: info\0".getBytes(StandardCharsets.US_ASCII), browserKey, senderKey);
        byte[] ikm = expand(hmac(authSecret, shared), keyInfo, 32);
        byte[] prk = hmac(salt, ikm);
        byte[] contentKey = expand(prk, "Content-Encoding: aes128gcm\0".getBytes(StandardCharsets.US_ASCII), 16);
        byte[] nonce = expand(prk, "Content-Encoding: nonce\0".getBytes(StandardCharsets.US_ASCII), 12);

        var cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(contentKey, "AES"), new GCMParameterSpec(128, nonce));
        byte[] sealed = cipher.doFinal(concat(plaintext, new byte[] {2}));

        var header = ByteBuffer.allocate(16 + 4 + 1 + senderKey.length);
        header.put(salt).putInt(RECORD_SIZE).put((byte) senderKey.length).put(senderKey);
        return concat(header.array(), sealed);
    }

    static byte[] hmac(byte[] key, byte[] data) throws GeneralSecurityException {
        var mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return mac.doFinal(data);
    }

    // HKDF-Expand for one block: enough for every length Web Push asks for.
    private static byte[] expand(byte[] prk, byte[] info, int length) throws GeneralSecurityException {
        return Arrays.copyOf(hmac(prk, concat(info, new byte[] {1})), length);
    }

    static byte[] concat(byte[]... parts) {
        var out = new ByteArrayOutputStream();
        for (byte[] part : parts) out.writeBytes(part);
        return out.toByteArray();
    }

    private static void copyUnsigned(BigInteger value, byte[] out, int offset) {
        byte[] bytes = value.toByteArray();
        int start = Math.max(0, bytes.length - 32);
        int length = bytes.length - start;
        System.arraycopy(bytes, start, out, offset + 32 - length, length);
    }

    private static ECParameterSpec p256() {
        try {
            return ((ECPublicKey) newKeyPair().getPublic()).getParams();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("P-256 is not available", e);
        }
    }
}

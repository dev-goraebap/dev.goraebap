package xyz.goraebap.foundation.user.application;

public interface AuthSecrets {
    String token();

    String code();

    String hash(String purpose, String raw);

    /** How the old cowork-hr app stored its refresh tokens: SHA-256 of the UTF-8 text, in lowercase hex, no key. */
    String legacyHash(String raw);

    boolean matches(String expected, String actual);
}

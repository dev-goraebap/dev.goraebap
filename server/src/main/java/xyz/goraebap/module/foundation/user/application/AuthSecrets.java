package xyz.goraebap.module.foundation.user.application;

public interface AuthSecrets {
    String token();

    String code();

    String hash(String purpose, String raw);

    boolean matches(String expected, String actual);
}

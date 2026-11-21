package xyz.goraebap.foundation.user.application;

public interface OtpDelivery {
    void send(String email, String code);
}

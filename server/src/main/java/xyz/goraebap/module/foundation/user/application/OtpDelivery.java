package xyz.goraebap.module.foundation.user.application;

public interface OtpDelivery {
    void send(String email, String code);
}

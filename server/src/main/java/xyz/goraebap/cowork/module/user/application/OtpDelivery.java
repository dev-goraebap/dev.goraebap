package xyz.goraebap.cowork.module.user.application;

public interface OtpDelivery {
    void send(String email, String code);
}

package xyz.goraebap.cowork.module.user.infrastructure;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import xyz.goraebap.cowork.module.user.application.OtpDelivery;
import xyz.goraebap.cowork.shared.config.Product;
import xyz.goraebap.cowork.shared.error.CommonErrorCode;

/**
 * Mails the login code. A local run (app.mail.log-codes, the dev profile) without a mail server writes the code to the
 * log instead, so signing in locally needs no SMTP account.
 */
@Slf4j
@Component
final class SmtpOtpDelivery implements OtpDelivery {
    private final ObjectProvider<JavaMailSender> javaMailSenderProvider;
    private final String from;
    private final boolean logOnly;

    SmtpOtpDelivery(
            ObjectProvider<JavaMailSender> javaMailSenderProvider,
            @Value("${app.mail.from:}") String from,
            @Value("${spring.mail.host:}") String host,
            @Value("${app.mail.log-codes:false}") boolean logCodes) {
        this.javaMailSenderProvider = javaMailSenderProvider;
        this.from = from;
        this.logOnly = logCodes && host.isBlank();
    }

    public void send(String email, String code) {
        if (logOnly) {
            log.info("로컬 로그인 인증 코드 {}: {} (메일 서버가 없어 보내지 않음)", email, code);
            return;
        }
        JavaMailSender mail = javaMailSenderProvider.getIfAvailable();
        if (mail == null || from.isBlank()) throw CommonErrorCode.COMMON_MAIL_DELIVERY_FAILED.raise();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject(Product.NAME + " 로그인 인증 코드");
        message.setText("로그인 인증 코드: " + code + "\n요청하지 않았다면 이 메일을 무시해 주세요.");
        try {
            mail.send(message);
        } catch (MailException exception) {
            throw CommonErrorCode.COMMON_MAIL_DELIVERY_FAILED.raise();
        }
    }
}

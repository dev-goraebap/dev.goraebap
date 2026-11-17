package xyz.goraebap.module.foundation.user.application;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties("app.auth")
public record AuthSettings(
        String secret,
        @DefaultValue("app_session") String cookieName,
        @DefaultValue("true") boolean cookieSecure,
        @DefaultValue("PT5M") Duration otpTtl,
        @DefaultValue("5") int maxAttempts,
        @DefaultValue("PT1M") Duration resendInterval,
        @DefaultValue("P30D") Duration sessionTtl,
        @DefaultValue("P90D") Duration absoluteTtl,
        @DefaultValue("PT1H") Duration touchInterval,
        List<String> allowedOrigins,
        @DefaultValue("false") boolean devLogin) {
    public AuthSettings {
        if (secret == null || secret.length() < 32)
            throw new IllegalArgumentException("AUTH_SECRET must contain at least 32 characters");
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
        if (allowedOrigins.isEmpty()) throw new IllegalArgumentException("AUTH_ALLOWED_ORIGINS is required");
        if (maxAttempts < 1
                || maxAttempts > 10
                || otpTtl.isNegative()
                || otpTtl.isZero()
                || resendInterval.isNegative()
                || resendInterval.isZero()
                || sessionTtl.isNegative()
                || sessionTtl.isZero()
                || absoluteTtl.compareTo(sessionTtl) < 0
                || touchInterval.isNegative()
                || touchInterval.isZero()
                || touchInterval.compareTo(sessionTtl) >= 0)
            throw new IllegalArgumentException("Invalid authentication policy");
    }
}

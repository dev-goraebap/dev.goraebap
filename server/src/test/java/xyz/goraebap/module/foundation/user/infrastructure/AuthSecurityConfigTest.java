package xyz.goraebap.module.foundation.user.infrastructure;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.StandardEnvironment;
import xyz.goraebap.module.foundation.user.application.AuthSettings;

class AuthSecurityConfigTest {
    @Test
    void productionRejectsDevelopmentLoginEvenWithDevelopmentProfile() {
        var environment = new StandardEnvironment();
        environment.setActiveProfiles("dev", "prod");
        assertThatThrownBy(() -> new AuthSecurityConfig()
                        .security(null, null, null, null, settings(true, true), environment, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("disabled development login");
    }

    @Test
    void qaAndProductionRejectInsecureCookies() {
        for (String profile : List.of("qa", "prod")) {
            var environment = new StandardEnvironment();
            environment.setActiveProfiles(profile);
            assertThatThrownBy(() -> new AuthSecurityConfig()
                            .security(null, null, null, null, settings(false, false), environment, null))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("secure cookies");
        }
    }

    private static AuthSettings settings(boolean secure, boolean developmentLogin) {
        return new AuthSettings(
                "test-only-secret-00000000000000000000000000000000",
                "app_session",
                secure,
                Duration.ofMinutes(5),
                5,
                Duration.ofMinutes(1),
                Duration.ofDays(30),
                Duration.ofDays(90),
                Duration.ofHours(1),
                List.of("https://example.test"),
                developmentLogin);
    }
}

package xyz.goraebap.foundation.user.application.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import xyz.goraebap.foundation.user.application.AuthSecrets;
import xyz.goraebap.foundation.user.application.AuthSettings;
import xyz.goraebap.foundation.user.domain.identity.IdentityRepository;
import xyz.goraebap.foundation.user.domain.session.LegacySessionRepository;
import xyz.goraebap.foundation.user.domain.session.SessionRepository;

class LegacyCarryOverCutOffTest {
    private static final Instant CUT_OFF = Instant.parse("2026-11-30T15:00:00Z");
    private static final String TOKEN = "A".repeat(43);

    private final LegacySessionRepository legacy = mock(LegacySessionRepository.class);
    private final AuthSecrets secrets = mock(AuthSecrets.class);

    @Test
    void noOldSignInIsLookedUpFromTheCutOffOn() {
        assertThat(service(CUT_OFF, CUT_OFF).carryOver(TOKEN)).isEmpty();
        verifyNoInteractions(legacy, secrets);
    }

    @Test
    void beforeTheCutOffOrWithoutOneTheTokenIsLookedUp() {
        when(secrets.legacyHash(anyString())).thenReturn("hash");
        when(legacy.consume(anyString(), any())).thenReturn(Optional.empty());
        assertThat(service(CUT_OFF, CUT_OFF.minusSeconds(1)).carryOver(TOKEN)).isEmpty();
        assertThat(service(null, CUT_OFF.plus(Duration.ofDays(30))).carryOver(TOKEN))
                .isEmpty();
        verify(legacy).consume("hash", CUT_OFF.minusSeconds(1));
        verify(legacy).consume("hash", CUT_OFF.plus(Duration.ofDays(30)));
    }

    @Test
    void somethingOtherThanAnOldTokenIsNotLookedUp() {
        assertThat(service(null, CUT_OFF).carryOver("not-a-token")).isEmpty();
        assertThat(service(null, CUT_OFF).carryOver(null)).isEmpty();
        verifyNoInteractions(legacy, secrets);
    }

    private SessionService service(Instant cutOff, Instant now) {
        var settings = new AuthSettings(
                "test-only-secret-00000000000000000000000000000000",
                "cowork_session",
                "",
                true,
                Duration.ofMinutes(5),
                5,
                Duration.ofMinutes(1),
                Duration.ofDays(30),
                Duration.ofDays(90),
                Duration.ofHours(1),
                List.of("https://example.test"),
                false,
                cutOff);
        return new SessionService(
                mock(SessionRepository.class),
                legacy,
                mock(IdentityRepository.class),
                secrets,
                settings,
                Clock.fixed(now, ZoneOffset.UTC));
    }
}

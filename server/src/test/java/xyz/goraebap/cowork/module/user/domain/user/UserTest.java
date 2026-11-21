package xyz.goraebap.cowork.module.user.domain.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import xyz.goraebap.cowork.module.user.Gender;
import xyz.goraebap.cowork.module.user.UserStatus;
import xyz.goraebap.cowork.shared.error.DomainRuleViolation;

class UserTest {
    private static final Instant NOW = Instant.parse("2026-09-18T00:00:00Z");

    @Test
    void lifecycleOnlyMovesForwardAndSignInFollowsIt() {
        var user = invited();
        assertThat(user.loginAllowed()).isFalse();
        user.activate(NOW);
        assertThat(user.status()).isEqualTo(UserStatus.ACTIVE);
        assertThat(user.activatedAt()).isEqualTo(NOW);
        assertThat(user.loginAllowed()).isTrue();
        assertThatThrownBy(() -> user.activate(NOW)).isInstanceOf(DomainRuleViolation.class);
        user.terminate(LocalDate.of(2026, 9, 30));
        assertThat(user.editable()).isFalse();
        assertThat(user.loginAllowed()).isFalse();
        assertThatThrownBy(() -> user.editBasics("신입", "new@example.test", null))
                .isInstanceOf(DomainRuleViolation.class);
        assertThatThrownBy(() -> user.terminate(LocalDate.of(2026, 10, 1))).isInstanceOf(DomainRuleViolation.class);
    }

    @Test
    void registeringAsWorkingActivatesAtOnceButNotAsLeft() {
        var user = User.register(UUID.randomUUID(), "신입", "New@Example.test", null, UserStatus.ACTIVE, NOW);
        assertThat(user.status()).isEqualTo(UserStatus.ACTIVE);
        assertThat(user.loginAllowed()).isTrue();
        assertThat(user.email()).isEqualTo("new@example.test");
        assertThatThrownBy(() ->
                        User.register(UUID.randomUUID(), "신입", "a@example.test", null, UserStatus.TERMINATED, NOW))
                .isInstanceOf(DomainRuleViolation.class);
    }

    @Test
    void basicsAreNormalizedAndValidated() {
        var user = invited();
        user.editBasics(" 신입 ", " New@Example.TEST ", Gender.MALE);
        assertThat(user.name()).isEqualTo("신입");
        assertThat(user.email()).isEqualTo("new@example.test");
        assertThat(user.gender()).isEqualTo(Gender.MALE);
        assertThatThrownBy(() -> user.editBasics("신입", "nope", null)).isInstanceOf(DomainRuleViolation.class);
        assertThatThrownBy(() -> user.editBasics(" ", "new@example.test", null))
                .isInstanceOf(DomainRuleViolation.class);
    }

    @Test
    void rejectedEditLeavesStateUntouched() {
        var user = invited();
        assertThatThrownBy(() -> user.editBasics("바뀐 이름", "nope", null)).isInstanceOf(DomainRuleViolation.class);
        assertThat(user.name()).isEqualTo("신입");
    }

    private static User invited() {
        return User.register(UUID.randomUUID(), "신입", "new@example.test", null, UserStatus.INVITED, NOW);
    }
}

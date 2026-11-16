package xyz.goraebap.foundation.realtime;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SignalTest {
    private static final UUID MEMBER = UUID.randomUUID();
    private static final UUID OTHER = UUID.randomUUID();

    @Test
    void aSignalReachesItsRecipientsAndAdministratorsOnlyWhenAskedTo() {
        var toMember = Signal.to(Signal.Topic.PUSH, UUID.randomUUID(), List.of(MEMBER));
        assertThat(toMember.reaches(MEMBER, false)).isTrue();
        assertThat(toMember.reaches(OTHER, true)).isFalse();

        var alsoAdministrators = toMember.andAdministrators();
        assertThat(alsoAdministrators.reaches(MEMBER, false)).isTrue();
        assertThat(alsoAdministrators.reaches(OTHER, true)).isTrue();
        assertThat(alsoAdministrators.reaches(OTHER, false)).isFalse();

        assertThat(Signal.toEveryone(Signal.Topic.ANNOUNCEMENT, UUID.randomUUID())
                        .reaches(OTHER, false))
                .isTrue();
    }
}

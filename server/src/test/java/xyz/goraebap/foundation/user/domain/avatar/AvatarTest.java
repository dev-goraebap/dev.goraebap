package xyz.goraebap.foundation.user.domain.avatar;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import xyz.goraebap.shared.error.DomainRuleViolation;

class AvatarTest {
    @Test
    void aPictureAndAChosenDefaultExcludeEachOther() {
        var avatar = Avatar.derived(UUID.randomUUID());
        avatar.choosePreset(17);
        assertThat(avatar.preset()).isEqualTo(17);

        var picture = UUID.randomUUID();
        avatar.usePicture(picture);
        assertThat(avatar.preset()).isNull();
        assertThat(avatar.pictureId()).isEqualTo(picture);

        avatar.choosePreset(0);
        assertThat(avatar.hasPicture()).isFalse();
        avatar.reset();
        assertThat(avatar.preset()).isNull();
        assertThat(avatar.pictureId()).isNull();
    }

    @Test
    void onlyTheDrawnDefaultsMayBeChosen() {
        var avatar = Avatar.derived(UUID.randomUUID());
        avatar.choosePreset(3);
        for (int number : new int[] {-1, Avatar.PRESETS})
            assertThatThrownBy(() -> avatar.choosePreset(number)).isInstanceOf(DomainRuleViolation.class);
        assertThat(avatar.preset()).isEqualTo(3);
    }
}

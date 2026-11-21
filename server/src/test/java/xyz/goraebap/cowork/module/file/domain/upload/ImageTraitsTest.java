package xyz.goraebap.cowork.module.file.domain.upload;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import xyz.goraebap.cowork.shared.error.DomainRuleViolation;

class ImageTraitsTest {
    @Test
    void keepsAColourAndASizeGivenTogether() {
        var traits = ImageTraits.of("#A1B2C3", 1200, 800);
        assertThat(traits).isEqualTo(new ImageTraits("#a1b2c3", 1200, 800));
        assertThat(traits.measured(512, 512)).isEqualTo(new ImageTraits("#a1b2c3", 512, 512));
        assertThat(ImageTraits.of(null, null, null)).isEqualTo(ImageTraits.NONE);
    }

    @Test
    void refusesMalformedColoursAndHalfOrImpossibleSizes() {
        assertThatThrownBy(() -> ImageTraits.of("red", null, null)).isInstanceOf(DomainRuleViolation.class);
        assertThatThrownBy(() -> ImageTraits.of(null, 10, null)).isInstanceOf(DomainRuleViolation.class);
        assertThatThrownBy(() -> ImageTraits.of(null, 0, 10)).isInstanceOf(DomainRuleViolation.class);
        assertThatThrownBy(() -> ImageTraits.of(null, ImageTraits.MAX_SIDE + 1, 10))
                .isInstanceOf(DomainRuleViolation.class);
    }

    @Test
    void onlyPicturesKeepTheirTraits() {
        var traits = ImageTraits.of("#123456", 10, 10);
        var now = Instant.parse("2026-09-28T00:00:00Z");
        assertThat(PendingUpload.create("a.png", 10, UUID.randomUUID(), now, UploadPurpose.EVIDENCE, traits)
                        .traits())
                .isEqualTo(traits);
        assertThat(PendingUpload.create("a.pdf", 10, UUID.randomUUID(), now, UploadPurpose.EVIDENCE, traits)
                        .traits())
                .isEqualTo(ImageTraits.NONE);
    }
}

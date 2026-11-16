package xyz.goraebap.foundation.user.domain.avatar;

import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import xyz.goraebap.foundation.shared.error.DomainRuleViolation;

/**
 * How a member appears beside their name: a picture they sent, or one of the drawn defaults they chose, or, with
 * neither, the drawn default the screen derives from their id. A picture and a chosen default exclude each other.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Avatar {
    /** Drawn defaults: three faces on six backgrounds. */
    public static final int PRESETS = 18;
    /** Pictures are squares of this many pixels, cut and shrunk by the browser. */
    public static final int PICTURE_SIDE = 512;

    private final UUID userId;
    private Integer preset;
    private UUID pictureId;

    public static Avatar derived(UUID userId) {
        return new Avatar(userId, null, null);
    }

    public static Avatar fromPersistence(UUID userId, Integer preset, UUID pictureId) {
        return new Avatar(userId, preset, pictureId);
    }

    public boolean hasPicture() {
        return pictureId != null;
    }

    public void choosePreset(int number) {
        if (number < 0 || number >= PRESETS) throw new DomainRuleViolation("기본 프로필을 다시 골라 주세요");
        preset = number;
        pictureId = null;
    }

    /** Shows the attached picture; the chosen default is let go. */
    public void usePicture(UUID attachmentId) {
        if (attachmentId == null) throw new DomainRuleViolation("사진이 없습니다");
        preset = null;
        pictureId = attachmentId;
    }

    /** Back to the default derived from the id. */
    public void reset() {
        preset = null;
        pictureId = null;
    }
}

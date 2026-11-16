package xyz.goraebap.foundation.file.domain.upload;

import java.util.Locale;
import java.util.regex.Pattern;
import xyz.goraebap.foundation.shared.domain.ValueObject;
import xyz.goraebap.foundation.shared.error.DomainRuleViolation;

/**
 * How a picture looks before its bytes arrive: the colour most of it has, to paint its place with, and its size in
 * pixels, so a screen lays it out at its shape. The browser measures them; they only shape a placeholder, so a wrong
 * value costs a colour or a frame, never access. Each part may be missing.
 */
public record ImageTraits(String dominantColor, Integer width, Integer height) implements ValueObject {
    public static final ImageTraits NONE = new ImageTraits(null, null, null);
    /** Pixels a side may have, beyond any camera. */
    public static final int MAX_SIDE = 1_000_000;

    private static final Pattern COLOR = Pattern.compile("^#[0-9a-fA-F]{6}$");

    public static ImageTraits of(String dominantColor, Integer width, Integer height) {
        if (dominantColor != null && !COLOR.matcher(dominantColor).matches())
            throw new DomainRuleViolation("대표색은 #RRGGBB 형식이어야 합니다");
        if ((width == null) != (height == null)) throw new DomainRuleViolation("사진의 가로와 세로를 함께 보내 주세요");
        if (width != null && (width < 1 || width > MAX_SIDE || height < 1 || height > MAX_SIDE))
            throw new DomainRuleViolation("사진 크기를 확인해 주세요");
        return new ImageTraits(dominantColor == null ? null : dominantColor.toLowerCase(Locale.ROOT), width, height);
    }

    /** The same colour with the size decoding the stored bytes gave. */
    public ImageTraits measured(int width, int height) {
        return of(dominantColor, width, height);
    }
}

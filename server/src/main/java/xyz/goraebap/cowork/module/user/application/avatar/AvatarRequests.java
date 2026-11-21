package xyz.goraebap.cowork.module.user.application.avatar;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.UUID;

public final class AvatarRequests {
    private AvatarRequests() {}

    /**
     * The avatar to show: a drawn default by number, or a finished upload of a picture, or neither to go back to the
     * default derived from the id. Both at once are refused.
     */
    public record AvatarChange(@Min(0) @Max(17) Integer preset, UUID uploadId) {}
}

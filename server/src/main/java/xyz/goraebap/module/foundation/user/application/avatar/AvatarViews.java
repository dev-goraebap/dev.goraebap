package xyz.goraebap.module.foundation.user.application.avatar;

import java.util.UUID;

public final class AvatarViews {
    private AvatarViews() {}

    /**
     * A member's chosen avatar: the number of a drawn default (0-17), or the id of their picture, which is also the
     * picture's address and changes with every new one, with the picture's main colour (#rrggbb) to paint its place
     * until it loads. Members left out show the default derived from their id.
     */
    public record AvatarItem(UUID userId, Integer preset, UUID pictureId, String pictureColor) {
        AvatarItem withPictureColor(String color) {
            return new AvatarItem(userId, preset, pictureId, color);
        }
    }
}

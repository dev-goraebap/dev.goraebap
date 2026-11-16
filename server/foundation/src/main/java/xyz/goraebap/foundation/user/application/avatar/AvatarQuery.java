package xyz.goraebap.foundation.user.application.avatar;

import java.util.List;

public interface AvatarQuery {
    /** Every member who chose a drawn default or sent a picture; the rest derive theirs from the id. */
    List<AvatarViews.AvatarItem> findAllChosen();
}

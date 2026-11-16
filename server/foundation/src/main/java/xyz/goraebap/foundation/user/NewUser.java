package xyz.goraebap.foundation.user;

import java.util.UUID;

/** A member to register; the id is chosen by the caller and shared with its own record of them. */
public record NewUser(UUID id, String name, String email, UserStatus status) {
    public static final int NAME_MAX = 64;
    public static final int EMAIL_MAX = 254;
}

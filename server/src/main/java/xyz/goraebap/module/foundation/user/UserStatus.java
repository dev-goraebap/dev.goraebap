package xyz.goraebap.module.foundation.user;

/** A member's lifecycle: INVITED → ACTIVE → TERMINATED, never backwards. */
public enum UserStatus {
    INVITED,
    ACTIVE,
    TERMINATED
}

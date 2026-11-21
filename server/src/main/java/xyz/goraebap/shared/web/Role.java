package xyz.goraebap.shared.web;

/**
 * A role a member holds for the whole instance, each named as the Spring authority it grants. None holds another.
 */
public enum Role {
    /** Runs the system screens (status, push delivery) and gives out roles. */
    INSTANCE_ADMIN,
    /** Runs the workspace's administration. */
    WORKSPACE_ADMIN
}

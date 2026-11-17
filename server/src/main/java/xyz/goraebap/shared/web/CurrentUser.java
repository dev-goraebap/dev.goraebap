package xyz.goraebap.shared.web;

import java.util.Set;
import java.util.UUID;

/** The signed-in member acting in a request, for every module that needs who acts; the user module signs them in. */
public interface CurrentUser {
    UUID id();

    /** The roles the member holds, each also a Spring authority of the same name; empty for an ordinary member. */
    Set<Role> roles();

    default boolean instanceAdmin() {
        return roles().contains(Role.INSTANCE_ADMIN);
    }

    default boolean holds(Role role) {
        return roles().contains(role);
    }

    /**
     * The agent acting for the member with one of their agent tokens , as the token names it;
     * null when the member acts in their own browser session.
     */
    default String agentName() {
        return null;
    }

    default AgentActor agentProfile() {
        return null;
    }

    default boolean agent() {
        return agentName() != null;
    }
}

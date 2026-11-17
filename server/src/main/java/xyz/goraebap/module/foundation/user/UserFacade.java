package xyz.goraebap.module.foundation.user;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import xyz.goraebap.shared.web.AgentActor;

/** What other modules may ask of the members: registering them and changing who they are, and reading them. */
public interface UserFacade {
    /**
     * The member to register, checked and with the e-mail in its one spelling; refuses with the rule broken, so a form
     * registering many can name the row at fault.
     */
    NewUser checked(NewUser user);

    /** Who already uses each of the given e-mails, by status, including members who have left; free ones are left out. */
    Map<String, UserStatus> emailOwners(Collection<String> emails);

    /** The status of another member using the e-mail, compared in its one spelling; empty when nobody else does. */
    Optional<UserStatus> emailOwner(String email, UUID exceptUserId);

    /** Registers checked members; conflicts when someone already uses one of the e-mails. */
    void registerAll(UUID actor, List<NewUser> users);

    /** Changes the name and the e-mail (the sign-in address with it); conflicts when the e-mail is taken. */
    void editBasics(UUID actor, UUID userId, String name, String email);

    /** An invited member starts work and may sign in. */
    void activate(UUID actor, UUID userId);

    /**
     * The member can no longer sign in; conflicts when no instance administrator would be left.
     */
    void terminate(UUID actor, UUID userId);

    /** Whether the member has left, so their records elsewhere become read-only; empty for nobody. */
    Optional<Boolean> hasLeft(UUID userId);

    /** Everyone who holds the role, for a domain that treats its own administrators apart. */
    java.util.Set<UUID> holdersOf(xyz.goraebap.shared.web.Role role);

    /** Names, with the department the space that keeps one names, for the given people in one batch; unknown ids are left out. */
    Map<UUID, UserSummary> summariesOf(Collection<UUID> userIds);

    /** Current names of known agent profiles, indexed by profile ID. */
    Map<UUID, String> agentNamesOf(Collection<UUID> profileIds);

    /** Display identities of the member's agents whose tokens are currently usable. */
    List<AgentActor> activeAgentsOf(UUID userId);

    /** The names of everyone who may sign in, by id: invited members and those who have left are left out. */
    Map<UUID, String> activeNames();

    /** The sign-in email of someone who may sign in; empty for the invited, those who have left and unknown ids. */
    Optional<String> activeEmail(UUID userId);

    /**
     * Someone to act for the server itself, as a seed import does: the member who may sign in with the given e-mail,
     * else the instance administrator, else the member, who may sign in and was invited first; empty with nobody.
     */
    Optional<UUID> standIn(String email);
}

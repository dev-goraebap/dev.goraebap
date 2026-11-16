package xyz.goraebap.foundation.user.application.account;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import xyz.goraebap.foundation.shared.web.Role;

public interface UserQuery {
    /** Names of the given members, including those who have left; unknown ids are left out. */
    Map<UUID, String> namesOf(Collection<UUID> userIds);

    /** Names of the members who may sign in, everyone invited or left aside. */
    Map<UUID, String> activeNames();

    /** The email of a member who may sign in. */
    Optional<String> activeEmail(UUID userId);

    /** The member who may sign in with the e-mail, given in its one spelling. */
    Optional<UUID> activeIdByEmail(String email);

    /** Of the members who may sign in, holding the role when one is given, the one invited first. */
    Optional<UUID> firstActive(Role role);
}

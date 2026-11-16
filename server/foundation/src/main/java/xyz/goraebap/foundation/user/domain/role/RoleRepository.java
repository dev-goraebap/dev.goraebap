package xyz.goraebap.foundation.user.domain.role;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import xyz.goraebap.foundation.shared.web.Role;

public interface RoleRepository {
    /** The member's roles; none held is an empty set, not a missing member. */
    MemberRoles findByUserId(UUID userId);

    /** Each given member's roles, one for every id given, in no particular order. */
    List<MemberRoles> findAllByUserId(Collection<UUID> userIds);

    /** Some member who may sign in holds the role. */
    boolean existsActiveHolder(Role role);

    /** Everyone who holds the role, whether or not they may sign in. */
    java.util.Set<UUID> findHolders(Role role);

    /** A role newly held is recorded with the moment and who gave it; one kept keeps its first grant. */
    void save(MemberRoles memberRoles, UUID actor);

    void saveAll(List<MemberRoles> memberRoles, UUID actor);
}

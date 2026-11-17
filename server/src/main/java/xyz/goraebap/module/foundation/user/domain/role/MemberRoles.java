package xyz.goraebap.module.foundation.user.domain.role;

import java.util.Collection;
import java.util.Collections;
import java.util.TreeSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import lombok.EqualsAndHashCode;
import xyz.goraebap.shared.error.DomainRuleViolation;
import xyz.goraebap.shared.web.Role;

/**
 * The roles one member holds for the whole instance; none holds another. A member holding none is an ordinary member.
 * The rule that some instance administrator always remains spans every member, so the service checks it after saving.
 */
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public final class MemberRoles {
    @EqualsAndHashCode.Include
    private final UUID userId;

    private final TreeSet<Role> roles;

    private MemberRoles(UUID userId, Collection<Role> roles) {
        this.userId = userId;
        this.roles = roles.isEmpty() ? new TreeSet<Role>() : new TreeSet<>(roles);
    }

    public static MemberRoles fromPersistence(UUID userId, Collection<Role> roles) {
        return new MemberRoles(userId, roles);
    }

    public UUID userId() {
        return userId;
    }

    /** In the roles' own order. */
    public Set<Role> roles() {
        return Collections.unmodifiableSet(new TreeSet<>(roles));
    }

    public boolean holds(Role role) {
        return roles.contains(role);
    }

    /** The member holds exactly the given roles from now on. */
    public void replace(Collection<Role> roles) {
        if (roles == null || roles.stream().anyMatch(Objects::isNull))
            throw new DomainRuleViolation("권한을 올바르게 선택해 주세요");
        var next = roles.isEmpty() ? new TreeSet<Role>() : new TreeSet<>(roles);
        this.roles.clear();
        this.roles.addAll(next);
    }

    /** Holding it already changes nothing. */
    public void grant(Role role) {
        roles.add(role);
    }
}

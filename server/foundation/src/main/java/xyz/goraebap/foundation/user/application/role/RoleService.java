package xyz.goraebap.foundation.user.application.role;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.foundation.shared.error.DomainRuleViolation;
import xyz.goraebap.foundation.user.RoleSpi;
import xyz.goraebap.foundation.user.application.AuthErrorCode;
import xyz.goraebap.foundation.user.domain.role.RoleRepository;
import xyz.goraebap.foundation.user.domain.user.User;
import xyz.goraebap.foundation.user.domain.user.UserRepository;
import xyz.goraebap.foundation.shared.web.Role;

/**
 * Who holds which role, given out by instance administrators. Some member who may sign in always holds
 * INSTANCE_ADMIN once one does, so roles can still be given out.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;
    private final RoleQuery roleQuery;
    private final UserRepository userRepository;
    /** 조립에 들어온 도메인이 내놓는 역할. 없으면 INSTANCE_ADMIN만 줄 수 있다. */
    private final List<RoleSpi> roleSpis;

    /** The roles that can be given out here: INSTANCE_ADMIN and what each domain offers, in the roles' own order. */
    public Set<Role> known() {
        return Stream.concat(Stream.of(Role.INSTANCE_ADMIN), roleSpis.stream().flatMap(spi -> spi.roles().stream()))
                .collect(Collectors.toCollection(java.util.TreeSet::new));
    }

    @Transactional(readOnly = true)
    public List<RoleViews.RoleMember> members() {
        return roleQuery.findMembers();
    }

    /** Replaces the member's roles; conflicts when it would leave no instance administrator who can sign in. */
    @Transactional
    public void change(UUID actor, UUID userId, RoleRequests.RoleChange request) {
        userRepository.lockAdminChanges();
        userRepository
                .findByIdForUpdate(userId)
                .filter(User::editable)
                .orElseThrow(AuthErrorCode.AUTH_NOT_FOUND::raise);
        var memberRoles = roleRepository.findByUserId(userId);
        boolean wasInstanceAdmin = memberRoles.holds(Role.INSTANCE_ADMIN);
        if (!known().containsAll(request.roles())) throw new DomainRuleViolation("권한을 올바르게 선택해 주세요");
        memberRoles.replace(request.roles());
        roleRepository.save(memberRoles, actor);
        if (wasInstanceAdmin && !memberRoles.holds(Role.INSTANCE_ADMIN)) requireInstanceAdminLeft();
    }

    /**
     * Makes the members who may sign in with the given e-mails instance administrators, leaving their other roles as
     * they are; those who already are change nothing. Returns how many were made one now.
     */
    @Transactional
    public int grantInstanceAdmins(Collection<String> emails) {
        var wanted = emails.stream()
                .map(User::normalEmail)
                .filter(email -> !email.isEmpty())
                .distinct()
                .toList();
        if (wanted.isEmpty()) return 0;
        userRepository.lockAdminChanges();
        var ids = userRepository.findActiveIdsByEmail(wanted);
        // The addresses themselves stay out of the log; the count is enough to notice a mistyped setting.
        if (ids.size() < wanted.size())
            log.warn(
                    "{} of {} instance administrator e-mails match no member who can sign in",
                    wanted.size() - ids.size(),
                    wanted.size());
        var granted = roleRepository.findAllByUserId(ids.values()).stream()
                .filter(memberRoles -> !memberRoles.holds(Role.INSTANCE_ADMIN))
                .toList();
        granted.forEach(memberRoles -> memberRoles.grant(Role.INSTANCE_ADMIN));
        roleRepository.saveAll(granted, null);
        log.info("{} member(s) made instance administrators from the server's settings", granted.size());
        return granted.size();
    }

    // Checked after the change under the write lock; the failure rolls the whole request back.
    private void requireInstanceAdminLeft() {
        if (!roleRepository.existsActiveHolder(Role.INSTANCE_ADMIN)) throw AuthErrorCode.AUTH_LAST_ADMIN.raise();
    }
}

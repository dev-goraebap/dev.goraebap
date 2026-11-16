package xyz.goraebap.foundation.user.application.account;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.foundation.user.AffiliationSpi;
import xyz.goraebap.foundation.user.NewUser;
import xyz.goraebap.foundation.user.UserFacade;
import xyz.goraebap.foundation.user.UserStatus;
import xyz.goraebap.foundation.user.UserSummary;
import xyz.goraebap.foundation.user.application.AuthErrorCode;
import xyz.goraebap.foundation.user.domain.agenttoken.AgentProfileRepository;
import xyz.goraebap.foundation.user.domain.agenttoken.AgentToken;
import xyz.goraebap.foundation.user.domain.agenttoken.AgentTokenRepository;
import xyz.goraebap.foundation.user.domain.role.RoleRepository;
import xyz.goraebap.foundation.user.domain.user.User;
import xyz.goraebap.foundation.user.domain.user.UserRepository;
import xyz.goraebap.foundation.shared.web.AgentActor;
import xyz.goraebap.foundation.shared.web.Role;

@Service
@RequiredArgsConstructor
public class UserService implements UserFacade {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AgentTokenRepository agentTokenRepository;
    private final AgentProfileRepository agentProfileRepository;
    private final UserQuery userQuery;
    /** 소속을 아는 도메인이 조립에 없으면 비어 있다. */
    private final Optional<AffiliationSpi> affiliation;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public NewUser checked(NewUser user) {
        User.requireRegistrable(user.status());
        return new NewUser(
                user.id(), User.validName(user.name()), User.validEmail(user.email()), user.status());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, UserStatus> emailOwners(Collection<String> emails) {
        return userRepository.statusesByEmail(
                emails.stream().map(User::normalEmail).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserStatus> emailOwner(String email, UUID exceptUserId) {
        return userRepository.statusOfEmailOwner(User.normalEmail(email), exceptUserId);
    }

    @Override
    @Transactional
    public void registerAll(UUID actor, List<NewUser> users) {
        var now = clock.instant();
        var registered = users.stream()
                .map(user -> User.register(user.id(), user.name(), user.email(), user.status(), now))
                .toList();
        if (!userRepository
                .statusesByEmail(registered.stream().map(User::email).toList())
                .isEmpty()) throw AuthErrorCode.AUTH_EMAIL_DUPLICATED.raise();
        userRepository.saveAll(registered, actor);
    }

    @Override
    @Transactional
    public void editBasics(UUID actor, UUID userId, String name, String email) {
        var user = get(userId);
        user.editBasics(name, email);
        if (userRepository.statusOfEmailOwner(user.email(), userId).isPresent())
            throw AuthErrorCode.AUTH_EMAIL_DUPLICATED.raise();
        userRepository.save(user, actor);
    }

    @Override
    @Transactional
    public void activate(UUID actor, UUID userId) {
        var user = get(userId);
        user.activate(clock.instant());
        userRepository.save(user, actor);
    }

    @Override
    @Transactional
    public void terminate(UUID actor, UUID userId) {
        userRepository.lockAdminChanges();
        var user = get(userId);
        user.terminate();
        userRepository.save(user, actor);
        // A member who leaves can no longer sign in, and the agents acting for them stop with them.
        agentTokenRepository.revokeAllByUserId(userId, clock.instant());
        // Only an instance administrator leaving can take away the last one; an install that has none yet still lets
        // members leave.
        if (roleRepository.findByUserId(userId).holds(Role.INSTANCE_ADMIN)) requireInstanceAdminLeft();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Boolean> hasLeft(UUID userId) {
        return userRepository.findById(userId).map(user -> !user.editable());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, UserSummary> summariesOf(Collection<UUID> userIds) {
        Map<UUID, UserSummary> summaries = new HashMap<>();
        if (userIds.isEmpty()) return summaries;
        var names = userQuery.namesOf(userIds);
        Map<UUID, String> affiliations =
                affiliation.map(spi -> spi.affiliationNamesOf(names.keySet())).orElse(Map.of());
        names.forEach((id, name) -> summaries.put(id, new UserSummary(id, name, affiliations.get(id))));
        return summaries;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, String> agentNamesOf(Collection<UUID> profileIds) {
        return agentProfileRepository.namesOf(profileIds);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AgentActor> activeAgentsOf(UUID userId) {
        var now = clock.instant();
        var activeIds = agentTokenRepository.findAllLiveByUserId(userId).stream()
                .filter(token -> token.usable(now))
                .map(AgentToken::profileId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (activeIds.isEmpty()) return List.of();
        return agentProfileRepository.findAllByUserId(userId).stream()
                .filter(profile -> activeIds.contains(profile.id()))
                .map(profile -> new AgentActor(profile.id(), profile.name(), profile.icon(), profile.color()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.Set<UUID> holdersOf(Role role) {
        return roleRepository.findHolders(role);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, String> activeNames() {
        return userQuery.activeNames();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> activeEmail(UUID userId) {
        return userQuery.activeEmail(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UUID> standIn(String email) {
        return Optional.ofNullable(email)
                .filter(given -> !given.isBlank())
                .flatMap(given -> userQuery.activeIdByEmail(User.normalEmail(given)))
                .or(() -> userQuery.firstActive(Role.INSTANCE_ADMIN))
                .or(() -> userQuery.firstActive(null));
    }

    // Checked after the change under the write lock; the failure rolls the whole request back.
    private void requireInstanceAdminLeft() {
        if (!roleRepository.existsActiveHolder(Role.INSTANCE_ADMIN)) throw AuthErrorCode.AUTH_LAST_ADMIN.raise();
    }

    private User get(UUID userId) {
        return userRepository.findByIdForUpdate(userId).orElseThrow(AuthErrorCode.AUTH_NOT_FOUND::raise);
    }
}

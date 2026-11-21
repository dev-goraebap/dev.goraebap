package xyz.goraebap.cowork.module.user.application.agenttoken;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.cowork.module.user.application.AuthErrorCode;
import xyz.goraebap.cowork.module.user.application.AuthSecrets;
import xyz.goraebap.cowork.module.user.domain.agenttoken.AgentProfile;
import xyz.goraebap.cowork.module.user.domain.agenttoken.AgentProfileRepository;
import xyz.goraebap.cowork.module.user.domain.agenttoken.AgentToken;
import xyz.goraebap.cowork.module.user.domain.agenttoken.AgentTokenRepository;
import xyz.goraebap.cowork.module.user.domain.identity.IdentityRepository;
import xyz.goraebap.cowork.module.user.domain.session.LoginSession;
import xyz.goraebap.cowork.module.user.domain.session.SessionRepository;
import xyz.goraebap.cowork.shared.web.AgentActor;
import xyz.goraebap.cowork.shared.web.CurrentUser;

/**
 * Agent tokens (cowork-guide-agent-access): a member makes them in their own browser session, never with a token, and
 * with a valid browser session. The token is
 * shown once and kept as a keyed hash. An agent presenting it acts as the member, with the roles they hold at that
 * moment, while the token is neither expired nor revoked and the member may still sign in.
 */
@Service
@RequiredArgsConstructor
public class AgentTokenService {
    /** How many working tokens a member may hold at once. */
    static final int LIVE_MAX = 20;

    /** Every token starts with this, so one pasted in the wrong place is recognised (and found by secret scanners). */
    static final String SCHEME = "cowork_";

    private static final Pattern TOKEN = Pattern.compile("cowork_[A-Za-z0-9_-]{43}");
    private static final int PREFIX_LENGTH = SCHEME.length() + 5;
    private static final String PURPOSE = "agent-token";

    private final AgentTokenRepository agentTokenRepository;
    private final AgentProfileRepository agentProfileRepository;
    private final SessionRepository sessionRepository;
    private final IdentityRepository identityRepository;
    private final AuthSecrets authSecrets;
    private final Clock clock;

    /** The member's tokens still working or expired, newest first; revoked ones are gone from the list. */
    @Transactional(readOnly = true)
    public List<AgentTokenViews.TokenView> list(CurrentUser user) {
        requireOwnSession(user);
        var profiles = agentProfileRepository.findAllByUserId(user.id()).stream()
                .collect(java.util.stream.Collectors.toMap(AgentProfile::id, java.util.function.Function.identity()));
        Instant now = clock.instant();
        return agentTokenRepository.findAllLiveByUserId(user.id()).stream()
                .map(token -> view(token, profiles.get(token.profileId()), now))
                .toList();
    }

    /** Makes a token in the member's own valid session; its secret comes back once. */
    @Transactional
    public AgentTokenViews.Created create(CurrentUser user, String sessionToken, AgentTokenRequests.Create request) {
        requireOwnSession(user);
        Instant now = clock.instant();
        Optional<LoginSession> session = sessionToken == null
                ? Optional.empty()
                : sessionRepository.findByHashForUpdate(authSecrets.hash("session", sessionToken));
        if (session.isEmpty()
                || !session.get().userId().equals(user.id())
                || !now.isBefore(session.get().expiresAt()))
            throw AgentTokenErrorCode.AGENT_TOKEN_SIGN_IN_AGAIN.raise();
        long working = agentTokenRepository.findAllLiveByUserId(user.id()).stream()
                .filter(token -> token.usable(now))
                .count();
        if (working >= LIVE_MAX) throw AgentTokenErrorCode.AGENT_TOKEN_LIMIT.raise();
        Instant expiresAt = expiration(request, now);
        AgentProfile profile = profileForIssuance(user, request);
        String secret = SCHEME + authSecrets.token();
        var token = AgentToken.create(
                UUID.randomUUID(),
                user.id(),
                request.name(),
                profile.name(),
                secret.substring(0, PREFIX_LENGTH),
                authSecrets.hash(PURPOSE, secret),
                now,
                expiresAt);
        token.connect(profile.id());
        agentTokenRepository.save(token);
        return new AgentTokenViews.Created(view(token, profile, now), secret);
    }

    /** Stops one of the member's tokens at once; an agent using it is refused from its next request. */
    @Transactional
    public void revoke(CurrentUser user, UUID tokenId) {
        requireOwnSession(user);
        var token = agentTokenRepository
                .findById(tokenId)
                .filter(found -> found.userId().equals(user.id()) && found.revokedAt() == null)
                .orElseThrow(AgentTokenErrorCode.AGENT_TOKEN_NOT_FOUND::raise);
        token.revoke(clock.instant());
        agentTokenRepository.save(token);
    }

    /**
     * The member a token acts for, when it is one of ours, working, and its member may still sign in; its last use is
     * noted (with where it came from) at most once a minute.
     */
    @Transactional
    public Optional<AgentTokenViews.Agent> authenticate(String secret, String ip) {
        if (secret == null || !TOKEN.matcher(secret).matches()) return Optional.empty();
        String hash = authSecrets.hash(PURPOSE, secret);
        Instant now = clock.instant();
        var found = agentTokenRepository
                .findByHash(hash)
                .filter(token -> authSecrets.matches(hash, token.hash()) && token.usable(now));
        if (found.isEmpty()) return Optional.empty();
        var token = found.get();
        var identity = identityRepository.findActiveById(token.userId());
        if (identity.isEmpty()) return Optional.empty();
        if (token.touch(now, ip)) agentTokenRepository.save(token);
        var profile = token.profileId() == null
                ? null
                : agentProfileRepository
                        .findById(token.profileId())
                        .filter(p -> p.userId().equals(token.userId()))
                        .orElse(null);
        if (token.profileId() != null && profile == null) return Optional.empty();
        var member = identity.get();
        return Optional.of(new AgentTokenViews.Agent(
                member.id(),
                member.email(),
                member.name().isBlank() ? member.email() : member.name(),
                member.roles(),
                token.id(),
                profile == null ? token.agentName() : profile.name(),
                profile == null
                        ? null
                        : new AgentActor(profile.id(), profile.name(), profile.icon(), profile.color())));
    }

    @Transactional(readOnly = true)
    public List<AgentTokenViews.ProfileView> profiles(CurrentUser user) {
        requireOwnSession(user);
        return agentProfileRepository.findAllByUserId(user.id()).stream()
                .map(p -> new AgentTokenViews.ProfileView(p.id(), p.name(), p.icon(), p.color(), p.version()))
                .toList();
    }

    @Transactional
    public void editProfile(CurrentUser user, UUID id, AgentTokenRequests.EditProfile request) {
        requireOwnSession(user);
        var profile = ownedProfile(user, id);
        if (agentTokenRepository
                .findByProfileId(id)
                .filter(token -> token.usable(clock.instant()))
                .isEmpty()) throw AgentTokenErrorCode.AGENT_PROFILE_INACTIVE.raise();
        if (profile.version() != request.expectedVersion())
            throw AgentTokenErrorCode.AGENT_PROFILE_VERSION_CONFLICT.raise();
        profile.revise(request.name(), request.icon(), request.color());
        agentProfileRepository.save(profile);
    }

    private AgentProfile profileForIssuance(CurrentUser user, AgentTokenRequests.Create request) {
        String name = request.agentName() == null ? request.name() : request.agentName();
        if (request.profileId() == null) {
            var profile = AgentProfile.create(
                    UUID.randomUUID(),
                    user.id(),
                    name,
                    request.icon() == null ? "agent" : request.icon(),
                    request.color() == null ? "#5e6ad2" : request.color());
            agentProfileRepository.save(profile);
            return profile;
        }
        // Only a draft saved before one-step issuance may receive its first token.
        var profile = ownedProfile(user, request.profileId());
        if (agentTokenRepository.findByProfileId(profile.id()).isPresent())
            throw AgentTokenErrorCode.AGENT_PROFILE_ALREADY_CONNECTED.raise();
        profile.revise(
                name,
                request.icon() == null ? profile.icon() : request.icon(),
                request.color() == null ? profile.color() : request.color());
        agentProfileRepository.save(profile);
        return profile;
    }

    private Instant expiration(AgentTokenRequests.Create request, Instant now) {
        if (request.expiresOn() != null) {
            if (request.lifetime() != null
                    || request.expiresOn().isBefore(now.atZone(clock.getZone()).toLocalDate())
                    || request.expiresOn().isAfter(LocalDate.of(9999, 12, 30)))
                throw AgentTokenErrorCode.AGENT_TOKEN_EXPIRY_INVALID.raise();
            return request.expiresOn().plusDays(1).atStartOfDay(clock.getZone()).toInstant();
        }
        if (request.lifetime() == null) throw AgentTokenErrorCode.AGENT_TOKEN_EXPIRY_INVALID.raise();
        Duration length = request.lifetime().length();
        return length == null ? null : now.plus(length);
    }

    private AgentProfile ownedProfile(CurrentUser user, UUID id) {
        return agentProfileRepository
                .findById(id)
                .filter(p -> p.userId().equals(user.id()))
                .orElseThrow(AgentTokenErrorCode.AGENT_PROFILE_NOT_FOUND::raise);
    }

    /** A token cannot make or revoke tokens; only the member in their own browser can. */
    private static void requireOwnSession(CurrentUser user) {
        if (user.agent()) throw AuthErrorCode.AUTH_FORBIDDEN.raise();
    }

    private static AgentTokenViews.TokenView view(AgentToken token, AgentProfile profile, Instant now) {
        return new AgentTokenViews.TokenView(
                token.id(),
                token.name(),
                profile == null ? token.agentName() : profile.name(),
                token.prefix(),
                token.createdAt(),
                token.expiresAt(),
                token.lastUsedAt(),
                token.lastUsedIp(),
                token.expired(now),
                token.profileId());
    }
}

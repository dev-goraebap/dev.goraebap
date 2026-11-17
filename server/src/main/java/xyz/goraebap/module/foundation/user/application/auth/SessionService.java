package xyz.goraebap.module.foundation.user.application.auth;

import java.time.Clock;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.module.foundation.user.application.AuthErrorCode;
import xyz.goraebap.module.foundation.user.application.AuthSecrets;
import xyz.goraebap.module.foundation.user.application.AuthSettings;
import xyz.goraebap.module.foundation.user.domain.identity.IdentityRepository;
import xyz.goraebap.module.foundation.user.domain.session.LoginSession;
import xyz.goraebap.module.foundation.user.domain.session.SessionRepository;

@Service
@RequiredArgsConstructor
public class SessionService {
    private final SessionRepository sessionRepository;
    private final IdentityRepository identityRepository;
    private final AuthSecrets authSecrets;
    private final AuthSettings authSettings;
    private final Clock clock;

    /**
     * Who a session cookie signs in, checked on every request. It runs outside a transaction: a transaction here would
     * take SQLite's one write lock (transaction_mode=IMMEDIATE) for every request and line up a page's parallel reads
     * behind each other. The rare writes, an expired session's removal and the hourly touch, are single statements.
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public Optional<AuthViews.Me> authenticate(String token) {
        if (token == null || !token.matches("[A-Za-z0-9_-]{43}")) return Optional.empty();
        String hash = authSecrets.hash("session", token);
        var stored = sessionRepository.findByHashForUpdate(hash);
        if (stored.isEmpty()) return Optional.empty();
        var session = stored.get();
        var now = clock.instant();
        var identity = identityRepository.findActiveById(session.userId());
        if (session.expired(now, authSettings.absoluteTtl()) || identity.isEmpty()) {
            sessionRepository.deleteByHash(hash);
            return Optional.empty();
        }
        if (!now.isBefore(session.touchedAt().plus(authSettings.touchInterval()))) {
            session.touch(now, authSettings.sessionTtl(), authSettings.absoluteTtl());
            // An update, not an upsert: a session signed out since it was read is not brought back.
            sessionRepository.touch(hash, session.touchedAt(), session.expiresAt());
        }
        var user = identity.get();
        // The e-mail keeps the header readable for a member registered without a name.
        String name = user.name().isBlank() ? user.email() : user.name();
        return Optional.of(
                new AuthViews.Me(user.id(), user.email(), name, user.roles(), user.onboarded(), session.expiresAt()));
    }

    @Transactional
    public AuthViews.Issued issue(UUID userId) {
        if (identityRepository.findActiveById(userId).isEmpty()) throw AuthErrorCode.AUTH_REQUIRED.raise();
        String token = authSecrets.token();
        var now = clock.instant();
        var session = LoginSession.create(
                authSecrets.hash("session", token), userId, now, now.plus(authSettings.sessionTtl()));
        sessionRepository.save(session);
        return new AuthViews.Issued(token, session.expiresAt());
    }

    @Transactional
    public void logout(String token) {
        if (token != null) sessionRepository.deleteByHash(authSecrets.hash("session", token));
    }

    @Transactional
    public void logoutAll(UUID userId) {
        sessionRepository.deleteAllByUserId(userId);
    }
}

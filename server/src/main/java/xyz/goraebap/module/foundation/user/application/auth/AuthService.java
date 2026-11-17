package xyz.goraebap.module.foundation.user.application.auth;

import java.time.Clock;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import xyz.goraebap.module.foundation.user.application.AuthErrorCode;
import xyz.goraebap.module.foundation.user.application.AuthSecrets;
import xyz.goraebap.module.foundation.user.application.AuthSettings;
import xyz.goraebap.module.foundation.user.application.OtpDelivery;
import xyz.goraebap.module.foundation.user.application.account.AccountQuery;
import xyz.goraebap.module.foundation.user.domain.identity.IdentityRepository;
import xyz.goraebap.module.foundation.user.domain.otp.Otp;
import xyz.goraebap.module.foundation.user.domain.otp.OtpRepository;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final IdentityRepository identityRepository;
    private final AccountQuery accountQuery;
    private final OtpRepository otpRepository;
    private final OtpDelivery otpDelivery;
    private final AuthSecrets authSecrets;
    private final AuthSettings authSettings;
    private final SessionService sessionService;
    private final Clock clock;
    private final PlatformTransactionManager transactionManager;

    private record Issued(String email, String code, Otp otp) {}

    /**
     * Saves a new code, then mails it once that has committed: the mail server may take seconds, and the database's
     * write lock is not held while it answers. A code that could not be sent is taken back, so asking again is not
     * held up by the resend interval.
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void requestCode(String email) {
        var transactions = new TransactionTemplate(transactionManager);
        var issued = transactions.execute(status -> issue(email));
        if (issued == null) return;
        try {
            otpDelivery.send(issued.email(), issued.code());
        } catch (RuntimeException e) {
            transactions.executeWithoutResult(status -> otpRepository.discard(issued.otp()));
            throw e;
        }
    }

    private Issued issue(String email) {
        var user = identityRepository.findActiveByEmailForUpdate(normalize(email));
        if (user.isEmpty()) return null; // Do not disclose whether an address belongs to a member.
        var now = clock.instant();
        var prior = otpRepository.findByUserIdForUpdate(user.get().id());
        if (prior.isPresent() && now.isBefore(prior.get().issuedAt().plus(authSettings.resendInterval())))
            throw AuthErrorCode.AUTH_RATE_LIMITED.raise();
        String code = authSecrets.code();
        var otp = Otp.create(
                user.get().id(),
                authSecrets.hash("otp:" + user.get().id(), code),
                now,
                now.plus(authSettings.otpTtl()));
        otpRepository.save(otp);
        return new Issued(user.get().email(), code, otp);
    }

    @Transactional
    public AuthViews.Verified verify(String email, String code) {
        var user = identityRepository.findActiveByEmailForUpdate(normalize(email));
        if (user.isEmpty()) return new AuthViews.Verified(null, AuthErrorCode.AUTH_CODE_INVALID);
        var stored = otpRepository.findByUserIdForUpdate(user.get().id());
        if (stored.isEmpty() || !stored.get().usable(clock.instant(), authSettings.maxAttempts()))
            return new AuthViews.Verified(null, AuthErrorCode.AUTH_CODE_INVALID);
        var otp = stored.get();
        boolean matches = authSecrets.matches(
                otp.hash(), authSecrets.hash("otp:" + user.get().id(), code));
        otp.attempt(matches);
        otpRepository.save(otp);
        // Return failure so the transaction commits the failed-attempt counter.
        return matches
                ? new AuthViews.Verified(sessionService.issue(user.get().id()), null)
                : new AuthViews.Verified(null, AuthErrorCode.AUTH_CODE_INVALID);
    }

    @Transactional(readOnly = true)
    public List<AuthViews.Member> members() {
        return accountQuery.loginAllowed();
    }

    @Transactional
    public AuthViews.Issued devLogin(UUID userId) {
        return sessionService.issue(userId);
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}

package xyz.goraebap.foundation.user.application.account;

import java.time.Clock;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.foundation.user.application.AuthErrorCode;
import xyz.goraebap.foundation.user.domain.user.UserRepository;

/**
 * The member's first-login onboarding. Screens send a member who has not finished it there first; finishing it is the
 * member's own act on their own account, so no other module calls it.
 */
@Service
@RequiredArgsConstructor
public class OnboardingService {
    private final UserRepository userRepository;
    private final Clock clock;

    @Transactional
    public void complete(UUID userId) {
        var user = userRepository.findByIdForUpdate(userId).orElseThrow(AuthErrorCode.AUTH_NOT_FOUND::raise);
        user.completeOnboarding(clock.instant());
        userRepository.save(user, userId);
    }
}

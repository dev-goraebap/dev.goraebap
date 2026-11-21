package xyz.goraebap.cowork.module.user.application.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.cowork.module.user.application.AuthCookies;
import xyz.goraebap.cowork.module.user.application.account.OnboardingService;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final SessionService sessionService;
    private final AuthCookies authCookies;
    private final OnboardingService onboardingService;

    public record CsrfView(String token, String headerName) {}

    @GetMapping("/csrf")
    public CsrfView csrf(CsrfToken token) {
        return new CsrfView(token.getToken(), token.getHeaderName());
    }

    @PostMapping("/otp/request")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void request(@Valid @RequestBody AuthRequests.RequestCode request) {
        authService.requestCode(request.email());
    }

    @PostMapping("/otp/verify")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void verify(
            @Valid @RequestBody AuthRequests.Verify request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        var result = authService.verify(request.email(), request.code());
        if (result.error() != null) throw result.error().raise();
        sessionService.logout(authCookies.read(httpRequest));
        authCookies.write(response, result.issued().token(), result.issued().expiresAt());
    }

    @GetMapping("/me")
    public AuthViews.Me me(@AuthenticationPrincipal AuthViews.Me user) {
        return user;
    }

    /** Marks the signed-in member's first-login onboarding done; the session says so from the next read on. */
    @PutMapping("/onboarding")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void completeOnboarding(@AuthenticationPrincipal AuthViews.Me user) {
        onboardingService.complete(user.id());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        sessionService.logout(authCookies.read(request));
        authCookies.clear(response);
    }

    @PostMapping("/logout-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logoutAll(@AuthenticationPrincipal AuthViews.Me user, HttpServletResponse response) {
        sessionService.logoutAll(user.id());
        authCookies.clear(response);
    }
}

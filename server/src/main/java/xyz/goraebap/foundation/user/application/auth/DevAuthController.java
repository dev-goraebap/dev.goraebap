package xyz.goraebap.foundation.user.application.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.foundation.user.application.AuthCookies;

@RestController
@Profile("(dev | qa) & !prod")
@ConditionalOnProperty(name = "app.auth.dev-login", havingValue = "true")
@RequestMapping("/api/v1/auth/dev")
@RequiredArgsConstructor
public class DevAuthController {
    private final AuthService authService;
    private final SessionService sessionService;
    private final AuthCookies authCookies;

    @GetMapping("/employees")
    public List<AuthViews.Employee> employees() {
        return authService.employees();
    }

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void login(
            @Valid @RequestBody AuthRequests.DevLogin request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        var issued = authService.devLogin(request.userId());
        sessionService.logout(authCookies.read(httpRequest));
        authCookies.write(response, issued.token(), issued.expiresAt());
    }
}

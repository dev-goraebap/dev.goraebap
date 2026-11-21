package xyz.goraebap.cowork.module.user.application;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthCookies {
    /**
     * The old cowork-hr app's sign-in cookies on the same host: a short-lived JWT and the refresh token the carry-over
     * reads. Both were HttpOnly, SameSite=Lax, Path=/ and host-only, so a cookie of the same name and path drops them.
     */
    private static final String LEGACY_ACCESS = "access_token";

    private static final String LEGACY_REFRESH = "refresh_token";

    private final AuthSettings authSettings;
    private final Clock clock;

    public String read(HttpServletRequest request) {
        return read(request, authSettings.cookieName());
    }

    public void write(HttpServletResponse response, String token, Instant expiresAt) {
        Duration left = Duration.between(clock.instant(), expiresAt);
        add(response, authSettings.cookieName(), token, left.isNegative() ? Duration.ZERO : left);
    }

    public void clear(HttpServletResponse response) {
        write(response, "", clock.instant());
    }

    /** The old app's refresh token, if the browser still holds one. */
    public String readLegacy(HttpServletRequest request) {
        return read(request, LEGACY_REFRESH);
    }

    public boolean hasLegacy(HttpServletRequest request) {
        return read(request, LEGACY_ACCESS) != null || read(request, LEGACY_REFRESH) != null;
    }

    /** Drops both of the old app's cookies, whatever became of the carry-over. */
    public void clearLegacy(HttpServletResponse response) {
        for (String name : List.of(LEGACY_ACCESS, LEGACY_REFRESH)) add(response, name, "", Duration.ZERO);
    }

    private static String read(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) for (Cookie cookie : cookies) if (cookie.getName().equals(name)) return cookie.getValue();
        return null;
    }

    private void add(HttpServletResponse response, String name, String value, Duration maxAge) {
        response.addHeader(
                HttpHeaders.SET_COOKIE,
                ResponseCookie.from(name, value)
                        .httpOnly(true)
                        .secure(authSettings.cookieSecure())
                        .sameSite("Lax")
                        .path("/")
                        .maxAge(maxAge)
                        .build()
                        .toString());
    }
}

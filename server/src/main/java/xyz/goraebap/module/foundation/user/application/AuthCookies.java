package xyz.goraebap.module.foundation.user.application;

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

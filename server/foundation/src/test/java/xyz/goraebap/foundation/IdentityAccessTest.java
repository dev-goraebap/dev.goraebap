package xyz.goraebap.foundation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.contains;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import xyz.goraebap.foundation.support.TestRoles;
import xyz.goraebap.foundation.user.UserFacade;
import xyz.goraebap.foundation.user.application.OtpDelivery;
import xyz.goraebap.foundation.user.application.auth.AuthService;
import xyz.goraebap.foundation.user.application.auth.SessionService;
import xyz.goraebap.foundation.user.domain.identity.IdentityRepository;
import xyz.goraebap.foundation.user.domain.session.SessionRepository;
import xyz.goraebap.foundation.shared.error.CommonErrorCode;
import xyz.goraebap.foundation.shared.persistence.InstantTextBinding;
import xyz.goraebap.foundation.shared.web.Role;
import xyz.goraebap.foundation.support.Accounts;
import xyz.goraebap.foundation.support.Members;
import xyz.goraebap.foundation.support.TestDatabase;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class IdentityAccessTest {
    private static final UUID USER = UUID.fromString("00000000-0000-0000-0000-000000000011");
    private static final UUID MANAGER = UUID.fromString("00000000-0000-0000-0000-000000000012");
    private static final Instant NOW = Instant.parse("2026-09-17T00:00:00Z");

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    AuthService auth;

    @Autowired
    SessionService sessions;

    @Autowired
    SessionRepository sessionRepository;

    @Autowired
    IdentityRepository identities;

    @Autowired
    UserFacade accounts;

    @MockitoBean
    OtpDelivery delivery;

    @MockitoBean
    Clock clock;

    private final AtomicReference<String> code = new AtomicReference<>();

    @BeforeEach
    void prepare() {
        when(clock.instant()).thenReturn(NOW);
        when(clock.getZone()).thenReturn(ZoneOffset.UTC);
        TestDatabase.clear(jdbc);
        for (UUID id : List.of(USER, MANAGER)) {
            jdbc.update(
                    "INSERT INTO users(user_id,email) VALUES (?,?)"
                            + " ON CONFLICT(user_id) DO UPDATE SET email=excluded.email",
                    id,
                    email(id));
            Members.insert(
                    jdbc,
                    Members.member(id, "Test Member", email(id))
                            .hired(java.time.LocalDate.now(java.time.ZoneOffset.UTC)));
        }
        Accounts.roles(jdbc, MANAGER, TestRoles.TEAM_ADMIN);
        doAnswer(invocation -> {
                    code.set(invocation.getArgument(1));
                    return null;
                })
                .when(delivery)
                .send(anyString(), anyString());
    }

    @Test
    void otpLogsInOnlyOnceAndStoresNoRawCredentials() throws Exception {
        mvc.perform(write(post("/api/v1/auth/otp/request")).content("{\"email\":\"" + email(USER) + "\"}"))
                .andExpect(status().isNoContent());
        String issuedCode = code.get();
        var response = mvc.perform(write(post("/api/v1/auth/otp/verify")).content(verification(issuedCode)))
                .andExpect(status().isNoContent())
                .andReturn()
                .getResponse();
        assertThat(response.getHeader("Set-Cookie")).contains("HttpOnly", "SameSite=Lax", "Path=/");
        Cookie cookie = response.getCookie("app_session");
        assertThat(cookie).isNotNull();
        mvc.perform(get("/api/v1/auth/me").cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(USER.toString()))
                .andExpect(jsonPath("$.name").value("Test Member"));
        mvc.perform(write(post("/api/v1/auth/otp/verify")).content(verification(issuedCode)))
                .andExpect(status().isBadRequest());
        assertThat(jdbc.queryForObject("SELECT code_hash FROM iam_otp", String.class))
                .isNotEqualTo(issuedCode);
        assertThat(jdbc.queryForObject("SELECT token_hash FROM iam_session", String.class))
                .isNotEqualTo(cookie.getValue());
    }

    @Test
    void wrongAttemptsPersistAndLockTheCode() {
        auth.requestCode(email(USER));
        String correct = code.get();
        String wrong = correct.equals("000000") ? "111111" : "000000";
        for (int index = 0; index < 5; index++)
            assertThat(auth.verify(email(USER), wrong).error()).isNotNull();
        assertThat(jdbc.queryForObject("SELECT attempts FROM iam_otp", Integer.class))
                .isEqualTo(5);
        assertThat(auth.verify(email(USER), correct).error()).isNotNull();
    }

    @Test
    void expiredCodesAndCooldownAreEnforced() {
        auth.requestCode(email(USER));
        assertThatThrownBy(() -> auth.requestCode(email(USER))).hasMessageContaining("잠시 후");
        when(clock.instant()).thenReturn(NOW.plusSeconds(301));
        assertThat(auth.verify(email(USER), code.get()).error()).isNotNull();
        auth.requestCode(email(USER));
        assertThat(auth.verify(email(USER), code.get()).error()).isNull();
    }

    @Test
    void unknownAndInactiveAccountsReceiveNoCode() {
        auth.requestCode("missing@example.test");
        assertThat(code.get()).isNull();
        jdbc.update("UPDATE users SET is_active=false WHERE user_id=?", USER);
        auth.requestCode(email(USER));
        assertThat(code.get()).isNull();
    }

    @Test
    void mailFailureRollsBackCodeIssuance() {
        doThrow(CommonErrorCode.COMMON_MAIL_DELIVERY_FAILED.raise())
                .when(delivery)
                .send(anyString(), anyString());
        assertThatThrownBy(() -> auth.requestCode(email(USER))).hasMessageContaining("메일");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM iam_otp", Integer.class))
                .isZero();
    }

    @Test
    void concurrentVerificationCreatesOnlyOneSession() throws Exception {
        auth.requestCode(email(USER));
        String current = code.get();
        var start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> {
                start.await();
                return auth.verify(email(USER), current);
            });
            var second = executor.submit(() -> {
                start.await();
                return auth.verify(email(USER), current);
            });
            start.countDown();
            assertThat(List.of(first.get(), second.get()).stream()
                            .filter(result -> result.error() == null)
                            .count())
                    .isEqualTo(1);
        }
        assertThat(jdbc.queryForObject("SELECT count(*) FROM iam_session", Integer.class))
                .isEqualTo(1);
    }

    @Test
    void csrfAndOriginAreRequiredEvenForLogin() throws Exception {
        mvc.perform(post("/api/v1/auth/otp/request")
                        .header("Origin", "http://localhost:4402")
                        .contentType("application/json")
                        .content("{\"email\":\"test@example.test\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/otp/request")
                        .header("Origin", "https://untrusted.example")
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/logout")).andExpect(status().isForbidden());
    }

    @Test
    void realCsrfHandshakeWorksWithoutServerHttpSession() throws Exception {
        var result =
                mvc.perform(get("/api/v1/auth/csrf")).andExpect(status().isOk()).andReturn();
        var tree = tools.jackson.databind.json.JsonMapper.builder()
                .build()
                .readTree(result.getResponse().getContentAsString());
        mvc.perform(post("/api/v1/auth/otp/request")
                        .cookie(result.getResponse().getCookies())
                        .header("Origin", "http://localhost:4402")
                        .header(
                                tree.get("headerName").asText(),
                                tree.get("token").asText())
                        .contentType("application/json")
                        .content("{\"email\":\"" + email(USER) + "\"}"))
                .andExpect(status().isNoContent());
        assertThat(result.getRequest().getSession(false)).isNull();
    }

    @Test
    void everyCsrfTokenOfOneCookieValidatesAndAStaleOneIsNamed() throws Exception {
        // The first token sets the cookie; later ones mask the same value anew, set no cookie, and all validate.
        var first = mvc.perform(get("/api/v1/auth/csrf")).andReturn();
        var csrf = first.getResponse().getCookie("XSRF-TOKEN");
        var signedInRead = mvc.perform(get("/api/v1/auth/me").cookie(csrf, cookie(USER)))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(signedInRead.getResponse().getCookie("XSRF-TOKEN")).isNull();
        var second =
                mvc.perform(get("/api/v1/auth/csrf").cookie(csrf, cookie(USER))).andReturn();
        assertThat(second.getResponse().getCookie("XSRF-TOKEN")).isNull();
        assertThat(token(second)).isNotEqualTo(token(first));
        for (var issued : List.of(first, second))
            mvc.perform(command(post("/api/v1/auth/logout"), csrf, token(issued))
                            .cookie(cookie(USER)))
                    .andExpect(status().isNoContent());
        // Asked at once without the cookie, two tokens set two cookies; the one whose cookie was overwritten is
        // refused by name, so the page can fetch a new token and retry. A missing token reads the same.
        var overwritten = mvc.perform(get("/api/v1/auth/csrf")).andReturn();
        mvc.perform(command(post("/api/v1/auth/logout"), csrf, token(overwritten))
                        .cookie(cookie(USER)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_CSRF_INVALID"));
        mvc.perform(post("/api/v1/auth/logout").cookie(csrf, cookie(USER)).header("Origin", "http://localhost:4402"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_CSRF_INVALID"));
        // A foreign origin stays a plain refusal: a new token would not help.
        mvc.perform(post("/api/v1/auth/logout")
                        .cookie(csrf, cookie(USER))
                        .header("X-XSRF-TOKEN", token(second))
                        .header("Origin", "https://untrusted.example"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN"));
    }

    @Test
    void logoutRevokesCurrentSessionAndLogoutAllRevokesEverySession() throws Exception {
        var first = cookie(USER);
        var second = cookie(USER);
        mvc.perform(write(post("/api/v1/auth/logout")).cookie(first)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/auth/me").cookie(first)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/auth/me").cookie(second)).andExpect(status().isOk());
        var third = cookie(USER);
        mvc.perform(write(post("/api/v1/auth/logout-all")).cookie(second)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/auth/me").cookie(third)).andExpect(status().isUnauthorized());
    }

    @Test
    void sessionRefreshRespectsAbsoluteExpiryAndAccountDeactivation() {
        String token = sessions.issue(USER).token();
        when(clock.instant()).thenReturn(NOW.plusSeconds(1800));
        sessions.authenticate(token);
        assertThat(InstantTextBinding.parse(jdbc.queryForObject("SELECT touched_at FROM iam_session", String.class)))
                .isEqualTo(NOW);
        for (int day : List.of(20, 40, 60, 80)) {
            when(clock.instant()).thenReturn(NOW.plusSeconds(day * 86400L));
            assertThat(sessions.authenticate(token)).isPresent();
        }
        when(clock.instant()).thenReturn(NOW.plusSeconds(90 * 86400L));
        assertThat(sessions.authenticate(token)).isEmpty();
        when(clock.instant()).thenReturn(NOW);
        token = sessions.issue(USER).token();
        jdbc.update("UPDATE users SET is_active=false WHERE user_id=?", USER);
        assertThat(sessions.authenticate(token)).isEmpty();
    }

    @Test
    void touchingASessionSignedOutMeanwhileDoesNotBringItBack() {
        String token = sessions.issue(USER).token();
        String hash = jdbc.queryForObject("SELECT token_hash FROM iam_session", String.class);
        sessions.logout(token);
        // The check reads the session outside a transaction, so a sign-out can land between its read and its touch.
        sessionRepository.touch(hash, NOW.plusSeconds(7200), NOW.plusSeconds(30 * 86400L));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM iam_session", Integer.class))
                .isZero();
        when(clock.instant()).thenReturn(NOW.plusSeconds(7200));
        assertThat(sessions.authenticate(token)).isEmpty();
    }

    @Test
    void sessionCarriesTheRolesInTheirOwnOrder() throws Exception {
        Accounts.roles(jdbc, MANAGER, TestRoles.SPACE_ADMIN, TestRoles.TEAM_ADMIN, Role.INSTANCE_ADMIN);
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(MANAGER)))
                .andExpect(jsonPath("$.roles").value(contains("INSTANCE_ADMIN", "SPACE_ADMIN", "TEAM_ADMIN")))
                .andExpect(jsonPath("$.admin").doesNotExist());
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(USER)))
                .andExpect(jsonPath("$.roles").isEmpty());
    }

    @Test
    void onboardingIsMarkedOnceForTheSignedInAccountOnly() throws Exception {
        // Every account starts not onboarded.
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(USER)))
                .andExpect(jsonPath("$.onboarded").value(false));
        mvc.perform(write(put("/api/v1/auth/onboarding"))).andExpect(status().isUnauthorized());

        mvc.perform(write(put("/api/v1/auth/onboarding")).cookie(cookie(USER))).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(USER)))
                .andExpect(jsonPath("$.onboarded").value(true));
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(MANAGER)))
                .andExpect(jsonPath("$.onboarded").value(false));
        assertThat(onboardedAt(USER)).isEqualTo(NOW);

        // Finishing again, say on another device, keeps the first time; other changes to the account keep it too.
        when(clock.instant()).thenReturn(NOW.plusSeconds(3600));
        mvc.perform(write(put("/api/v1/auth/onboarding")).cookie(cookie(USER))).andExpect(status().isNoContent());
        accounts.editBasics(MANAGER, USER, "새 이름", email(USER));
        assertThat(onboardedAt(USER)).isEqualTo(NOW);
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(USER)))
                .andExpect(jsonPath("$.onboarded").value(true))
                .andExpect(jsonPath("$.name").value("새 이름"));
    }

    @Test
    void developmentLoginIsUnavailableOutsideDevelopment() throws Exception {
        mvc.perform(get("/api/v1/auth/dev/members")).andExpect(status().isUnauthorized());
        mvc.perform(write(post("/api/v1/auth/dev/login"))
                        .cookie(cookie(MANAGER))
                        .content("{\"userId\":\"" + USER + "\"}"))
                .andExpect(status().isForbidden());
    }

    private Instant onboardedAt(UUID id) {
        return InstantTextBinding.parse(
                jdbc.queryForObject("SELECT onboarded_at FROM users WHERE user_id=?", String.class, id));
    }

    private Cookie cookie(UUID id) {
        return new Cookie("app_session", sessions.issue(id).token());
    }

    private static String email(UUID id) {
        return id + "@example.test";
    }

    private static String verification(String code) {
        return "{\"email\":\"" + email(USER) + "\",\"code\":\"" + code + "\"}";
    }

    private static String token(org.springframework.test.web.servlet.MvcResult result) throws Exception {
        return tools.jackson.databind.json.JsonMapper.builder()
                .build()
                .readTree(result.getResponse().getContentAsString())
                .get("token")
                .asText();
    }

    private static MockHttpServletRequestBuilder command(
            MockHttpServletRequestBuilder builder, Cookie csrf, String token) {
        return builder.cookie(csrf).header("X-XSRF-TOKEN", token).header("Origin", "http://localhost:4402");
    }

    private MockHttpServletRequestBuilder write(MockHttpServletRequestBuilder builder) throws Exception {
        var result =
                mvc.perform(get("/api/v1/auth/csrf")).andExpect(status().isOk()).andReturn();
        var tree = tools.jackson.databind.json.JsonMapper.builder()
                .build()
                .readTree(result.getResponse().getContentAsString());
        return builder.cookie(result.getResponse().getCookies())
                .header(tree.get("headerName").asText(), tree.get("token").asText())
                .header("Origin", "http://localhost:4402")
                .contentType("application/json");
    }
}

package xyz.goraebap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import xyz.goraebap.foundation.user.application.auth.SessionService;
import xyz.goraebap.support.TestDatabase;

/**
 * An install starts with nobody: the first start makes its first administrator, once, and that administrator adds the
 * others by e-mail, who may sign in at once and have yet to finish their onboarding.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class SetupTest {
    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    SessionService sessions;

    @BeforeEach
    void prepare() {
        TestDatabase.clear(jdbc);
    }

    @Test
    void theFirstStartMakesOneAdministratorAndThenCloses() throws Exception {
        mvc.perform(get("/api/v1/setup"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.needed").value(true));

        mvc.perform(write(post("/api/v1/setup")).content("{\"name\":\"첫 관리자\",\"email\":\"First@Example.test\"}"))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/v1/setup")).andExpect(jsonPath("$.needed").value(false));
        var admin = jdbc.queryForObject("SELECT user_id FROM users WHERE email='first@example.test'", UUID.class);
        assertThat(jdbc.queryForList("SELECT role FROM user_role WHERE user_id=? ORDER BY role", String.class, admin))
                .containsExactly("INSTANCE_ADMIN", "WORKSPACE_ADMIN");
        // The administrator signs in as everyone does (a code by e-mail), and starts with the onboarding.
        assertThat(jdbc.queryForObject("SELECT is_active FROM users WHERE user_id=?", Boolean.class, admin))
                .isTrue();
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("첫 관리자"))
                .andExpect(jsonPath("$.onboarded").value(false));

        mvc.perform(write(post("/api/v1/setup")).content("{\"name\":\"두 번째\",\"email\":\"second@example.test\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AUTH_SETUP_DONE"));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM users", Integer.class))
                .isEqualTo(1);
    }

    @Test
    void theFirstAdministratorNeedsANameAndAnEmail() throws Exception {
        mvc.perform(write(post("/api/v1/setup")).content("{\"name\":\" \",\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/setup")).andExpect(jsonPath("$.needed").value(true));
    }

    @Test
    void anAdministratorAddsMembersWhoMaySignInAtOnce() throws Exception {
        mvc.perform(write(post("/api/v1/setup")).content("{\"name\":\"관리자\",\"email\":\"admin@example.test\"}"))
                .andExpect(status().isCreated());
        var admin = jdbc.queryForObject("SELECT user_id FROM users WHERE email='admin@example.test'", UUID.class);

        mvc.perform(write(post("/api/v1/admin/members"))
                        .cookie(cookie(admin))
                        .content("{\"name\":\"새 구성원\",\"email\":\"new@example.test\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("새 구성원"))
                .andExpect(jsonPath("$.roles").isEmpty());
        var member = jdbc.queryForObject("SELECT user_id FROM users WHERE email='new@example.test'", UUID.class);
        assertThat(jdbc.queryForObject("SELECT is_active FROM users WHERE user_id=?", Boolean.class, member))
                .isTrue();
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(member)))
                .andExpect(jsonPath("$.onboarded").value(false));

        // The same e-mail twice, and anyone but an instance administrator, are refused.
        mvc.perform(write(post("/api/v1/admin/members"))
                        .cookie(cookie(admin))
                        .content("{\"name\":\"다시\",\"email\":\"NEW@example.test\"}"))
                .andExpect(status().isConflict());
        mvc.perform(write(post("/api/v1/admin/members"))
                        .cookie(cookie(member))
                        .content("{\"name\":\"몰래\",\"email\":\"sneak@example.test\"}"))
                .andExpect(status().isForbidden());
    }

    private Cookie cookie(UUID user) {
        return new Cookie("cowork_session", sessions.issue(user).token());
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

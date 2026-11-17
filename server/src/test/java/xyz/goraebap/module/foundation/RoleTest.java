package xyz.goraebap.module.foundation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.time.LocalDate;
import java.util.List;
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
import xyz.goraebap.module.foundation.support.TestRoles;
import xyz.goraebap.module.foundation.user.application.auth.SessionService;
import xyz.goraebap.module.foundation.user.application.role.RoleService;
import xyz.goraebap.shared.web.Role;
import xyz.goraebap.module.foundation.support.Accounts;
import xyz.goraebap.module.foundation.support.Members;
import xyz.goraebap.module.foundation.support.TestDatabase;

/**
 * The three roles are held apart: an instance administrator runs the system screens and gives out roles but not the
 * office, an office administrator the office but not the system screens. Some instance administrator always remains,
 * and the server's settings name instance administrators by e-mail.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class RoleTest {
    private static final UUID INSTANCE = id(1);
    private static final UUID OFFICE = id(2);
    private static final UUID MEMBER = id(3);
    private static final UUID LEFT = id(4);

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    SessionService sessions;

    @Autowired
    RoleService roleService;

    @BeforeEach
    void prepare() {
        TestDatabase.clear(jdbc);
        member(INSTANCE, "가인스턴스", "instance@example.test", "ACTIVE", Role.INSTANCE_ADMIN);
        member(OFFICE, "나오피스", "office@example.test", "ACTIVE", TestRoles.TEAM_ADMIN);
        member(MEMBER, "다구성원", "member@example.test", "ACTIVE");
        member(LEFT, "라퇴사", "left@example.test", "TERMINATED", TestRoles.TEAM_ADMIN);
    }

    @Test
    void eachRoleOpensOnlyItsOwnAdministration() throws Exception {
        mvc.perform(get("/api/v1/system/status").cookie(cookie(OFFICE))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/push-deliveries/summary").cookie(cookie(OFFICE)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/system/status").cookie(cookie(INSTANCE))).andExpect(status().isOk());


        mvc.perform(get("/api/v1/admin/roles").cookie(cookie(OFFICE))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/roles").cookie(cookie(MEMBER))).andExpect(status().isForbidden());
        mvc.perform(write(put("/api/v1/admin/roles/" + MEMBER))
                        .cookie(cookie(OFFICE))
                        .content("{\"roles\":[\"INSTANCE_ADMIN\"]}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void instanceAdministratorsListMembersAndReplaceTheirRoles() throws Exception {
        Cookie instance = cookie(INSTANCE);
        mvc.perform(get("/api/v1/admin/roles").cookie(instance))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[*].name").value(contains("가인스턴스", "나오피스", "다구성원")))
                .andExpect(jsonPath("$[0].id").value(INSTANCE.toString()))
                .andExpect(jsonPath("$[0].email").value("instance@example.test"))
                .andExpect(jsonPath("$[0].roles").value(contains("INSTANCE_ADMIN")))
                .andExpect(jsonPath("$[2].roles").isEmpty());

        mvc.perform(write(put("/api/v1/admin/roles/" + MEMBER))
                        .cookie(instance)
                        .content("{\"roles\":[\"SPACE_ADMIN\",\"TEAM_ADMIN\"]}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/admin/roles").cookie(instance))
                .andExpect(jsonPath("$[2].roles").value(contains("SPACE_ADMIN", "TEAM_ADMIN")));
        assertThat(jdbc.queryForList(
                        "SELECT granted_by FROM user_role WHERE user_id=? ORDER BY role", UUID.class, MEMBER))
                .containsOnly(INSTANCE);
        // The next request already carries the new roles.
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.roles").value(contains("SPACE_ADMIN", "TEAM_ADMIN")));

        mvc.perform(write(put("/api/v1/admin/roles/" + MEMBER)).cookie(instance).content("{\"roles\":[]}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.roles").isEmpty());

        mvc.perform(write(put("/api/v1/admin/roles/" + MEMBER)).cookie(instance).content("{\"roles\":[\"ADMIN\"]}"))
                .andExpect(status().isBadRequest());
        mvc.perform(write(put("/api/v1/admin/roles/" + MEMBER)).cookie(instance).content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(write(put("/api/v1/admin/roles/" + LEFT))
                        .cookie(instance)
                        .content("{\"roles\":[\"TEAM_ADMIN\"]}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("AUTH_NOT_FOUND"));
        mvc.perform(write(put("/api/v1/admin/roles/" + UUID.randomUUID()))
                        .cookie(instance)
                        .content("{\"roles\":[]}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void theLastInstanceAdministratorKeepsTheRole() throws Exception {
        Cookie instance = cookie(INSTANCE);
        mvc.perform(write(put("/api/v1/admin/roles/" + INSTANCE))
                        .cookie(instance)
                        .content("{\"roles\":[\"TEAM_ADMIN\"]}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AUTH_LAST_ADMIN"));
        assertThat(roles(INSTANCE)).containsExactly("INSTANCE_ADMIN");

        // With a second one, the first may step down.
        mvc.perform(write(put("/api/v1/admin/roles/" + MEMBER))
                        .cookie(instance)
                        .content("{\"roles\":[\"INSTANCE_ADMIN\"]}"))
                .andExpect(status().isNoContent());
        mvc.perform(write(put("/api/v1/admin/roles/" + INSTANCE))
                        .cookie(instance)
                        .content("{\"roles\":[\"TEAM_ADMIN\"]}"))
                .andExpect(status().isNoContent());
        assertThat(roles(INSTANCE)).containsExactly("TEAM_ADMIN");
    }

    @Test
    void theServerSettingsMakeInstanceAdministratorsByEmail() {
        int granted = roleService.grantInstanceAdmins(
                List.of(" Office@Example.test ", "member@example.test", "left@example.test", "nobody@example.test"));
        assertThat(granted).isEqualTo(2);
        assertThat(roles(OFFICE)).containsExactly("INSTANCE_ADMIN", "TEAM_ADMIN");
        assertThat(roles(MEMBER)).containsExactly("INSTANCE_ADMIN");
        assertThat(roles(LEFT)).containsExactly("TEAM_ADMIN");

        // Starting again changes nothing.
        assertThat(roleService.grantInstanceAdmins(List.of("office@example.test", "instance@example.test")))
                .isZero();
        assertThat(roleService.grantInstanceAdmins(List.of())).isZero();
    }

    private List<String> roles(UUID user) {
        return jdbc.queryForList("SELECT role FROM user_role WHERE user_id=? ORDER BY role", String.class, user);
    }

    private void member(UUID id, String name, String email, String status, Role... roles) {
        Accounts.upsert(jdbc, id, email, status.equals("ACTIVE"), roles);
        Members.insert(jdbc, Members.member(id, name, email).status(status).hired(LocalDate.parse("2020-01-01")));
    }

    private Cookie cookie(UUID user) {
        return new Cookie("app_session", sessions.issue(user).token());
    }

    private static UUID id(int value) {
        return UUID.fromString(String.format("00000000-0000-0000-0000-%012d", value));
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

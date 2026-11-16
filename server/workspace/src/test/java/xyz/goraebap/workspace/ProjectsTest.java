package xyz.goraebap.workspace;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.beans.factory.annotation.Qualifier;
import xyz.goraebap.workspace.WorkspaceDatabaseConfig;
import xyz.goraebap.workspace.support.WorkspaceTestDatabase;
import xyz.goraebap.workspace.WorkspaceRoles;
import jakarta.servlet.http.Cookie;
import java.time.LocalDate;
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
import xyz.goraebap.foundation.shared.web.Role;
import xyz.goraebap.foundation.support.Accounts;
import xyz.goraebap.foundation.support.Members;
import xyz.goraebap.foundation.support.TestDatabase;

/**
 * Projects as BIT keeps them, seen only by their members: a member is a viewer, an editor or an administrator, and a
 * project's administrators say who belongs with which role (one administrator always stays). Workspace administrators,
 * the administrators of every project, also make, order, archive, delete and restore them. A key may change, and the
 * old one still finds the project and stays its own. Each change goes over the version the screen read.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class ProjectsTest {
    private static final UUID ADMIN = id(1);
    private static final UUID MEMBER = id(2);
    private static final UUID LEFT = id(3);
    private static final UUID OTHER = id(4);

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    /** The workspace's own database; jdbc is the foundation's. */
    @Autowired
    @Qualifier(WorkspaceDatabaseConfig.DSL)
    JdbcTemplate ws;

    @Autowired
    SessionService sessions;

    @BeforeEach
    void prepare() {
        TestDatabase.clear(jdbc);
        WorkspaceTestDatabase.clear(ws);
        member(ADMIN, "가관리", "admin@example.test", "ACTIVE", WorkspaceRoles.ADMIN);
        member(MEMBER, "나구성원", "member@example.test", "ACTIVE");
        member(LEFT, "다퇴사", "left@example.test", "TERMINATED");
    }

    @Test
    void administratorsMakeProjectsAndOnlyTheirMembersSeeThem() throws Exception {
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(MEMBER))
                        .content(project("safe", "안전플랫폼")))
                .andExpect(status().isForbidden());
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(ADMIN))
                        .content(project("safe", "안전플랫폼")))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/workspace/projects/SAFE"));
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(ADMIN))
                        .content(project("FIS", "FIS")))
                .andExpect(status().isCreated());
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(ADMIN))
                        .content(project("SAFE", "다른 이름")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROJECT_KEY_CONFLICT"));

        // Who is not a member sees no project, and its address finds nothing.
        mvc.perform(get("/api/v1/workspace/projects").cookie(cookie(MEMBER))).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/v1/workspace/projects/SAFE").cookie(cookie(MEMBER)))
                .andExpect(status().isNotFound());

        join("SAFE", MEMBER, "VIEWER");
        mvc.perform(get("/api/v1/workspace/projects").cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].key").value(contains("SAFE")))
                .andExpect(jsonPath("$[0].name").value("안전플랫폼"))
                .andExpect(jsonPath("$[0].color").value("#5e6ad2"))
                .andExpect(jsonPath("$[0].memberCount").value(2))
                .andExpect(jsonPath("$[0].myRole").value("VIEWER"))
                .andExpect(jsonPath("$[0].can.view").value(true))
                .andExpect(jsonPath("$[0].can.edit").value(false))
                .andExpect(jsonPath("$[0].can.manage").value(false));
        mvc.perform(get("/api/v1/workspace/projects/safe").cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("SAFE"))
                .andExpect(jsonPath("$.version").value(0));
        mvc.perform(get("/api/v1/workspace/projects/FIS").cookie(cookie(MEMBER)))
                .andExpect(status().isNotFound());
        // A Workspace administrator sees every project and keeps each.
        mvc.perform(get("/api/v1/workspace/projects").cookie(cookie(ADMIN)))
                .andExpect(jsonPath("$[*].key").value(contains("SAFE", "FIS")))
                .andExpect(jsonPath("$[*].myRole").value(contains("ADMIN", "ADMIN")))
                .andExpect(jsonPath("$[1].can.manage").value(true));
    }

    @Test
    void aNewKeyKeepsTheOldOneForTheSameProject() throws Exception {
        create("P1", "안전플랫폼");
        join("P1", MEMBER, "VIEWER");
        mvc.perform(write(patch("/api/v1/workspace/projects/P1"))
                        .cookie(cookie(ADMIN))
                        .content(edit(0, "SAFE", "안전 플랫폼")))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/P1").cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("SAFE"))
                .andExpect(jsonPath("$.name").value("안전 플랫폼"))
                .andExpect(jsonPath("$.version").value(1));
        // The old key stays this project's, and an edit over the version read before conflicts.
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(ADMIN))
                        .content(project("P1", "다른 것")))
                .andExpect(status().isConflict());
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE"))
                        .cookie(cookie(ADMIN))
                        .content(edit(0, "SAFE", "늦은 고침")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROJECT_VERSION_CONFLICT"));
        // Taking the old key back makes it current again.
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE"))
                        .cookie(cookie(ADMIN))
                        .content(edit(1, "P1", "안전 플랫폼")))
                .andExpect(status().isNoContent());
        assertThat(ws.queryForList("SELECT prefix FROM project_key WHERE is_current ORDER BY prefix", String.class))
                .containsExactly("P1");
    }

    @Test
    void archivedProjectsAreReadButNotChangedAndDeletedOnesComeBack() throws Exception {
        create("SAFE", "안전플랫폼");
        join("SAFE", MEMBER, "ADMIN");
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/archive"))
                        .cookie(cookie(ADMIN))
                        .content("{\"expectedVersion\":0}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects").cookie(cookie(MEMBER))).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/v1/workspace/projects?status=ARCHIVED").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[*].key").value(contains("SAFE")))
                .andExpect(jsonPath("$[0].can.edit").value(false))
                .andExpect(jsonPath("$[0].can.manage").value(true));
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE"))
                        .cookie(cookie(ADMIN))
                        .content(edit(1, "SAFE", "고침")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROJECT_ARCHIVED"));

        mvc.perform(write(delete("/api/v1/workspace/projects/SAFE?expectedVersion=1"))
                        .cookie(cookie(ADMIN)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE").cookie(cookie(MEMBER)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/workspace/projects?status=DELETED").cookie(cookie(MEMBER)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/workspace/projects?status=DELETED").cookie(cookie(ADMIN)))
                .andExpect(jsonPath("$[*].key").value(contains("SAFE")));
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/restore"))
                        .cookie(cookie(ADMIN))
                        .content("{\"expectedVersion\":2}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE").cookie(cookie(MEMBER)))
                .andExpect(status().isOk());
    }

    @Test
    void projectAdministratorsSayWhoBelongsWithWhichRoleAndKeepOne() throws Exception {
        member(OTHER, "라동료", "other@example.test", "ACTIVE");
        create("SAFE", "안전플랫폼");
        create("FIS", "FIS");
        // Who does not see the project does not find it; an editor sees it but may not say who belongs.
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/members"))
                        .cookie(cookie(MEMBER))
                        .content(user(MEMBER)))
                .andExpect(status().isNotFound());
        join("SAFE", MEMBER, null);
        mvc.perform(get("/api/v1/workspace/projects/SAFE/members").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[*].name").value(contains("가관리", "나구성원")))
                .andExpect(jsonPath("$[*].role").value(contains("ADMIN", "EDITOR")));
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/members"))
                        .cookie(cookie(MEMBER))
                        .content(user(OTHER)))
                .andExpect(status().isForbidden());
        // Adding a member again changes nothing; who has left does not join.
        join("SAFE", MEMBER, "VIEWER");
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/members"))
                        .cookie(cookie(ADMIN))
                        .content(user(LEFT)))
                .andExpect(status().isNotFound());
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE/members/" + MEMBER))
                        .cookie(cookie(ADMIN))
                        .content(role("NONE")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PROJECT_ROLE_INVALID"));

        // The project's administrator, not a Workspace administrator, says who belongs and with which role.
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE/members/" + MEMBER))
                        .cookie(cookie(ADMIN))
                        .content(role("ADMIN")))
                .andExpect(status().isNoContent());
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/members"))
                        .cookie(cookie(MEMBER))
                        .content("{\"userId\":\"" + OTHER + "\",\"role\":\"VIEWER\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE").cookie(cookie(OTHER)))
                .andExpect(jsonPath("$.myRole").value("VIEWER"));
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE/members/" + ADMIN))
                        .cookie(cookie(MEMBER))
                        .content(role("EDITOR")))
                .andExpect(status().isNoContent());
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE/members/" + LEFT))
                        .cookie(cookie(MEMBER))
                        .content(role("EDITOR")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_MEMBER_NOT_FOUND"));
        // The last administrator stays.
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE/members/" + MEMBER))
                        .cookie(cookie(MEMBER))
                        .content(role("EDITOR")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROJECT_LAST_ADMIN"));
        mvc.perform(write(delete("/api/v1/workspace/projects/SAFE/members/" + MEMBER))
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROJECT_LAST_ADMIN"));
        // The area's memberships are those of the projects the reader sees.
        mvc.perform(get("/api/v1/workspace/projects/members").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[*].role").value(containsInAnyOrder("EDITOR", "ADMIN", "VIEWER")));
        mvc.perform(get("/api/v1/workspace/projects/members").cookie(cookie(ADMIN)))
                .andExpect(jsonPath("$", hasSize(4)));
        // Who leaves the project no longer finds it.
        mvc.perform(write(delete("/api/v1/workspace/projects/SAFE/members/" + OTHER))
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE").cookie(cookie(OTHER)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/members").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$", hasSize(2)));

        var safe = ws.queryForObject("SELECT project_id FROM project_key WHERE prefix='SAFE'", String.class);
        var fis = ws.queryForObject("SELECT project_id FROM project_key WHERE prefix='FIS'", String.class);
        mvc.perform(write(put("/api/v1/workspace/projects/order"))
                        .cookie(cookie(ADMIN))
                        .content("{\"ids\":[\"" + fis + "\"]}"))
                .andExpect(status().isConflict());
        mvc.perform(write(put("/api/v1/workspace/projects/order"))
                        .cookie(cookie(ADMIN))
                        .content("{\"ids\":[\"" + fis + "\",\"" + safe + "\"]}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects").cookie(cookie(ADMIN)))
                .andExpect(jsonPath("$[*].key").value(contains("FIS", "SAFE")));
    }

    @Test
    void eachMemberKeepsTheirOwnFavourites() throws Exception {
        create("SAFE", "안전플랫폼");
        create("FIS", "FIS");
        // A project the member does not see is not theirs to mark.
        mvc.perform(write(put("/api/v1/workspace/projects/FIS/favorite"))
                        .cookie(cookie(MEMBER))
                        .content("{\"favorite\":true}"))
                .andExpect(status().isNotFound());
        join("SAFE", MEMBER, "VIEWER");
        mvc.perform(write(put("/api/v1/workspace/projects/SAFE/favorite"))
                        .cookie(cookie(MEMBER))
                        .content("{\"favorite\":true}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/favorites").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get("/api/v1/workspace/projects/favorites").cookie(cookie(ADMIN)))
                .andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(get("/api/v1/workspace/projects/SAFE").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.favorite").value(true));
    }

    @Test
    void membershipAddsFavoritesOnceAndRespectsAnExplicitOffAcrossRejoins() throws Exception {
        create("SAFE", "안전플랫폼");
        mvc.perform(get("/api/v1/workspace/projects/SAFE").cookie(cookie(ADMIN)))
                .andExpect(jsonPath("$.favorite").value(true));
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/members"))
                        .cookie(cookie(ADMIN))
                        .content(user(MEMBER)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.favorite").value(true));
        mvc.perform(write(put("/api/v1/workspace/projects/SAFE/favorite"))
                        .cookie(cookie(MEMBER))
                        .content("{\"favorite\":false}"))
                .andExpect(status().isNoContent());
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/members"))
                        .cookie(cookie(ADMIN))
                        .content(user(MEMBER)))
                .andExpect(status().isNoContent());
        mvc.perform(write(delete("/api/v1/workspace/projects/SAFE/members/" + MEMBER))
                        .cookie(cookie(ADMIN)))
                .andExpect(status().isNoContent());
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/members"))
                        .cookie(cookie(ADMIN))
                        .content(user(MEMBER)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.favorite").value(false));
        mvc.perform(get("/api/v1/workspace/projects/favorites").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(write(put("/api/v1/workspace/projects/SAFE/favorite"))
                        .cookie(cookie(MEMBER))
                        .content("{\"favorite\":true}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/favorites").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$", hasSize(1)));
    }

    private void create(String key, String name) throws Exception {
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(ADMIN))
                        .content(project(key, name)))
                .andExpect(status().isCreated());
    }

    private static String project(String key, String name) {
        return "{\"key\":\"" + key + "\",\"name\":\"" + name + "\",\"icon\":\"rocket\",\"color\":\"#5E6AD2\"}";
    }

    private static String edit(long version, String key, String name) {
        return "{\"expectedVersion\":" + version + ",\"key\":\"" + key + "\",\"name\":\"" + name + "\"}";
    }

    /** The member joins the project with the role (the default, an editor, when null), as a Workspace administrator says. */
    private void join(String key, UUID member, String role) throws Exception {
        var body = role == null ? user(member) : "{\"userId\":\"" + member + "\",\"role\":\"" + role + "\"}";
        mvc.perform(write(post("/api/v1/workspace/projects/" + key + "/members"))
                        .cookie(cookie(ADMIN))
                        .content(body))
                .andExpect(status().isNoContent());
    }

    private static String role(String role) {
        return "{\"role\":\"" + role + "\"}";
    }

    private static String user(UUID id) {
        return "{\"userId\":\"" + id + "\"}";
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

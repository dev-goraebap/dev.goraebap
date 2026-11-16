package xyz.goraebap.workspace;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.beans.factory.annotation.Qualifier;
import xyz.goraebap.workspace.WorkspaceDatabaseConfig;
import xyz.goraebap.workspace.support.WorkspaceTestDatabase;
import xyz.goraebap.workspace.WorkspaceRoles;
import xyz.goraebap.foundation.support.TestRoles;
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
 * 탐색: one request finds the member's 업무 · 문서 · 공지 · … by their words, grouped by kind. Each kind shows
 * only what its own list shows the member, so a project they are not a member of adds nothing.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class SearchTest {
    private static final UUID ADMIN = id(1);
    private static final UUID MEMBER = id(2);

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
    void prepare() throws Exception {
        TestDatabase.clear(jdbc);
        WorkspaceTestDatabase.clear(ws);
        member(ADMIN, "가관리", "admin@example.test", WorkspaceRoles.ADMIN, TestRoles.TEAM_ADMIN);
        member(MEMBER, "나구성원", "member@example.test");
        project("SAFE", "안전관리");
        project("FIS", "재무");
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/members"))
                        .cookie(cookie(ADMIN))
                        .content("{\"userId\":\"" + MEMBER + "\"}"))
                .andExpect(status().isNoContent());
    }

    @Test
    void findsTheMembersThingsByTheirWordsGroupedByKind() throws Exception {
        issue("SAFE", "배포 점검표 만들기");
        issue("FIS", "배포 비용 정산");
        mvc.perform(write(post("/api/v1/workspace/documents"))
                        .cookie(cookie(MEMBER))
                        .content("{\"projectKey\":\"SAFE\",\"title\":\"운영 안내\",\"markdown\":\"배포 전에 백업을 확인한다.\"}"))
                .andExpect(status().isCreated());

        // A project the member is not in adds nothing: FIS's issue is not among the hits.
        mvc.perform(get("/api/v1/search").param("q", "배포").cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groups[*].kind").value(contains("work-item", "document")))
                .andExpect(jsonPath("$.groups[0].hits[*].title").value(contains("배포 점검표 만들기")))
                .andExpect(jsonPath("$.groups[0].hits[0].where").value("SAFE-1"))
                .andExpect(jsonPath("$.groups[0].hits[0].path").value("/workspace/projects/SAFE/work-items/1"))
                .andExpect(jsonPath("$.groups[1].hits[0].title").value("운영 안내"))
                .andExpect(jsonPath("$.groups[1].hits[0].excerpt").value(org.hamcrest.Matchers.containsString("배포")));

        // The administrator of every project finds both issues.
        mvc.perform(get("/api/v1/search").param("q", "배포").cookie(cookie(ADMIN)))
                .andExpect(jsonPath("$.groups[0].hits.length()").value(2));

        // Words found nowhere answer no groups; no words is a bad request.
        mvc.perform(get("/api/v1/search").param("q", "없는말").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.groups.length()").value(0));
        mvc.perform(get("/api/v1/search").param("q", " ").cookie(cookie(MEMBER)))
                .andExpect(status().isBadRequest());
    }

    private void project(String key, String name) throws Exception {
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(ADMIN))
                        .content("{\"key\":\"" + key + "\",\"name\":\"" + name
                                + "\",\"icon\":\"rocket\",\"color\":\"#5E6AD2\"}"))
                .andExpect(status().isCreated());
    }

    private void issue(String key, String title) throws Exception {
        mvc.perform(write(post("/api/v1/workspace/projects/" + key + "/issues"))
                        .cookie(cookie(ADMIN))
                        .content("{\"title\":\"" + title + "\"}"))
                .andExpect(status().isCreated());
    }

    private void member(UUID id, String name, String email, Role... roles) {
        Accounts.upsert(jdbc, id, email, true, roles);
        Members.insert(jdbc, Members.member(id, name, email).status("ACTIVE").hired(LocalDate.parse("2020-01-01")));
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

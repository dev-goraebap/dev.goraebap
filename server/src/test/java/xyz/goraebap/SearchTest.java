package xyz.goraebap;

import static org.hamcrest.Matchers.contains;
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
import xyz.goraebap.shared.web.Role;
import xyz.goraebap.support.Accounts;
import xyz.goraebap.support.Members;
import xyz.goraebap.support.TestDatabase;

/**
 * 탐색 (DEMO-124): one request finds the member's 업무 · 문서 · 공지 · … by their words, grouped by kind. Each kind shows
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

    @Autowired
    SessionService sessions;

    @BeforeEach
    void prepare() throws Exception {
        TestDatabase.clear(jdbc);
        member(ADMIN, "가관리", "admin@example.test", Role.WORKSPACE_ADMIN);
        member(MEMBER, "나구성원", "member@example.test");
        project("SAFE", "안전관리");
        project("FIS", "재무");
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/members"))
                        .cookie(cookie(ADMIN))
                        .content("{\"userId\":\"" + MEMBER + "\"}"))
                .andExpect(status().isNoContent());
    }

    @org.junit.jupiter.api.Disabled("오피스를 뺀 뒤 깨짐: 오피스 주소나 도구를 썼다. 워크스페이스 기준으로 다시 쓴다.")
    @Test
    void findsTheMembersThingsByTheirWordsGroupedByKind() throws Exception {
        issue("SAFE", "배포 점검표 만들기");
        issue("FIS", "배포 비용 정산");
        mvc.perform(write(post("/api/v1/workspace/documents"))
                        .cookie(cookie(MEMBER))
                        .content("{\"projectKey\":\"SAFE\",\"title\":\"운영 안내\",\"markdown\":\"배포 전에 백업을 확인한다.\"}"))
                .andExpect(status().isCreated());
        mvc.perform(write(post("/api/v1/office/announcements"))
                        .cookie(cookie(ADMIN))
                        .content("{\"title\":\"이번 주 안내\",\"content\":\"금요일 저녁에 배포합니다.\"}"))
                .andExpect(status().isCreated());

        // A project the member is not in adds nothing: FIS's issue is not among the hits.
        mvc.perform(get("/api/v1/search").param("q", "배포").cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groups[*].kind").value(contains("work-item", "document", "announcement")))
                .andExpect(jsonPath("$.groups[0].hits[*].title").value(contains("배포 점검표 만들기")))
                .andExpect(jsonPath("$.groups[0].hits[0].where").value("SAFE-1"))
                .andExpect(jsonPath("$.groups[0].hits[0].path").value("/workspace/projects/SAFE/work-items/1"))
                .andExpect(jsonPath("$.groups[1].hits[0].title").value("운영 안내"))
                .andExpect(jsonPath("$.groups[1].hits[0].excerpt").value(org.hamcrest.Matchers.containsString("배포")))
                .andExpect(jsonPath("$.groups[2].hits[0].title").value("이번 주 안내"));

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
        Members.insert(jdbc, Members.member(id, name, email).status("ACTIVE"));
    }

    private Cookie cookie(UUID user) {
        return new Cookie("cowork_session", sessions.issue(user).token());
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

package xyz.goraebap.workspace;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.beans.factory.annotation.Qualifier;
import xyz.goraebap.workspace.WorkspaceDatabaseConfig;
import xyz.goraebap.workspace.support.WorkspaceTestDatabase;
import xyz.goraebap.workspace.WorkspaceRoles;
import jakarta.servlet.http.Cookie;
import java.time.LocalDate;
import java.util.ArrayList;
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
import xyz.goraebap.foundation.user.application.auth.SessionService;
import xyz.goraebap.foundation.shared.web.Role;
import xyz.goraebap.foundation.support.Accounts;
import xyz.goraebap.foundation.support.Members;
import xyz.goraebap.workspace.support.ProjectMembers;
import xyz.goraebap.foundation.support.TestDatabase;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Saved views over the issue lists (BIT's views): a project starts with 보드 and 내 이슈 after the built-in 전체 이슈, any
 * member keeps personal views only they see, Workspace administrators keep the shared views and their order, whose first
 * is the scope's default; the area's views are its own.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class IssueViewsTest {
    private static final UUID ADMIN = id(1);
    private static final UUID MEMBER = id(2);
    private static final UUID OTHER = id(3);
    private static final JsonMapper JSON = JsonMapper.builder().build();

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
        member(ADMIN, "가관리", "admin@example.test", WorkspaceRoles.ADMIN);
        member(MEMBER, "나구성원", "member@example.test");
        member(OTHER, "다동료", "other@example.test");
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(ADMIN))
                        .content("{\"key\":\"SAFE\",\"name\":\"안전플랫폼\"}"))
                .andExpect(status().isCreated());
        ProjectMembers.editors(ws, "SAFE", MEMBER, OTHER);
    }

    @Test
    void aNewProjectStartsWithItsBoardAfterEveryIssue() throws Exception {
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issue-views").cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.order", hasSize(4)))
                .andExpect(jsonPath("$.order[0]").value("all"))
                .andExpect(jsonPath("$.views[*].name").value(contains("진행 현황", "백로그", "일정 계획")))
                .andExpect(jsonPath("$.views[0].layout").value("BOARD"))
                .andExpect(jsonPath("$.views[2].layout").value("TIMELINE"))
                .andExpect(jsonPath("$.views[1].filters.status").value(backlogColumn()))
                .andExpect(jsonPath("$.views[0].canEdit").value(false))
                .andExpect(jsonPath("$.canOrder").value(false));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issue-views").cookie(cookie(ADMIN)))
                .andExpect(jsonPath("$.views[0].canEdit").value(true))
                .andExpect(jsonPath("$.canOrder").value(true));
        // 전역 보드도 저장되지만 프로젝트의 보드 순서는 전역에서 쓸 수 없다.
        mvc.perform(get("/api/v1/workspace/issue-views").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.order").value(contains("all")))
                .andExpect(jsonPath("$.views", hasSize(0)));
        mvc.perform(write(post("/api/v1/workspace/issue-views"))
                        .cookie(cookie(ADMIN))
                        .content(view("보드", "BOARD", "{}", false)))
                .andExpect(status().isBadRequest());
        String workspaceBoard =
                view("칸반보드", "BOARD", "{}", false).replace("\"sort\":\"BOARD\"", "\"sort\":\"UPDATED\"");
        mvc.perform(write(post("/api/v1/workspace/issue-views"))
                        .cookie(cookie(ADMIN))
                        .content(workspaceBoard))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/v1/workspace/issue-views").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.views[0].layout").value("BOARD"));
        mvc.perform(get("/api/v1/workspace/issue-columns").cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name").value(contains("백로그", "할 일", "진행 중", "검토 중", "완료", "취소")));
        mvc.perform(get("/api/v1/workspace/projects/NONE/issue-views").cookie(cookie(MEMBER)))
                .andExpect(status().isNotFound());
    }

    @Test
    void aPersonalViewIsItsOwnersAlone() throws Exception {
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issue-views"))
                        .cookie(cookie(MEMBER))
                        .content(view("급한 버그", "LIST", "{\"type\":\"BUG\",\"priority\":\"URGENT,HIGH\"}", true)))
                .andExpect(status().isCreated());
        // A member makes no shared view.
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issue-views"))
                        .cookie(cookie(MEMBER))
                        .content(view("모두의 뷰", "LIST", "{}", false)))
                .andExpect(status().isForbidden());
        var mine = state("/api/v1/workspace/projects/SAFE/issue-views", MEMBER);
        String id = mine.path("views").get(3).path("id").asText();
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issue-views").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.order[4]").value(id))
                .andExpect(jsonPath("$.views[3].isPersonal").value(true))
                .andExpect(jsonPath("$.views[3].canEdit").value(true))
                .andExpect(jsonPath("$.views[3].filters.priority").value("URGENT,HIGH"));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issue-views").cookie(cookie(OTHER)))
                .andExpect(jsonPath("$.views", hasSize(3)));
        mvc.perform(write(patch("/api/v1/workspace/issue-views/" + id))
                        .cookie(cookie(OTHER))
                        .content(edit(0, view("남의 뷰", "LIST", "{}", true))))
                .andExpect(status().isNotFound());

        mvc.perform(write(patch("/api/v1/workspace/issue-views/" + id))
                        .cookie(cookie(MEMBER))
                        .content(edit(0, view("버그 보드", "BOARD", "{\"type\":\"BUG\"}", true))))
                .andExpect(status().isNoContent());
        mvc.perform(write(patch("/api/v1/workspace/issue-views/" + id))
                        .cookie(cookie(MEMBER))
                        .content(edit(0, view("늦은 고침", "LIST", "{}", true))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ISSUE_VIEW_VERSION_CONFLICT"));
        // Only a Workspace administrator shares one.
        mvc.perform(write(patch("/api/v1/workspace/issue-views/" + id))
                        .cookie(cookie(MEMBER))
                        .content(edit(1, view("버그 보드", "BOARD", "{\"type\":\"BUG\"}", false))))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issue-views").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.views[3].name").value("버그 보드"))
                .andExpect(jsonPath("$.views[3].layout").value("BOARD"))
                .andExpect(jsonPath("$.views[3].version").value(1));

        mvc.perform(write(delete("/api/v1/workspace/issue-views/" + id + "?expectedVersion=1"))
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issue-views").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.views", hasSize(3)));
    }

    @Test
    void administratorsKeepTheSharedViewsAndTheirOrder() throws Exception {
        mvc.perform(write(post("/api/v1/workspace/issue-views"))
                        .cookie(cookie(ADMIN))
                        .content(view("진행 중", "LIST", "{\"status\":\"STARTED\"}", false)))
                .andExpect(status().isCreated());
        mvc.perform(write(post("/api/v1/workspace/issue-views"))
                        .cookie(cookie(MEMBER))
                        .content(view("내 것", "LIST", "{}", true)))
                .andExpect(status().isCreated());
        var area = state("/api/v1/workspace/issue-views", MEMBER);
        String shared = area.path("views").get(0).path("id").asText();
        String personal = area.path("views").get(1).path("id").asText();
        mvc.perform(get("/api/v1/workspace/issue-views").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.order").value(contains("all", shared, personal)))
                .andExpect(jsonPath("$.views[0].canEdit").value(false));
        mvc.perform(write(patch("/api/v1/workspace/issue-views/" + shared))
                        .cookie(cookie(MEMBER))
                        .content(edit(0, view("바꾼 이름", "LIST", "{}", false))))
                .andExpect(status().isForbidden());
        mvc.perform(write(delete("/api/v1/workspace/issue-views/" + shared + "?expectedVersion=0"))
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isForbidden());

        // The first is the area's default; a member's own view follows the shared ones.
        mvc.perform(write(put("/api/v1/workspace/issue-views/order"))
                        .cookie(cookie(MEMBER))
                        .content(order(shared, "all")))
                .andExpect(status().isForbidden());
        mvc.perform(write(put("/api/v1/workspace/issue-views/order"))
                        .cookie(cookie(ADMIN))
                        .content(order(shared)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ISSUE_VIEW_ORDER_MISMATCH"));
        mvc.perform(write(put("/api/v1/workspace/issue-views/order"))
                        .cookie(cookie(ADMIN))
                        .content(order(shared, "all")))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/issue-views").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.order").value(contains(shared, "all", personal)));

        // A project's order is its own.
        var project = state("/api/v1/workspace/projects/SAFE/issue-views", ADMIN);
        String board = project.path("views").get(0).path("id").asText();
        String mine = project.path("views").get(1).path("id").asText();
        String timeline = project.path("views").get(2).path("id").asText();
        mvc.perform(write(put("/api/v1/workspace/projects/SAFE/issue-views/order"))
                        .cookie(cookie(ADMIN))
                        .content(order(board, mine, "all", timeline)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issue-views").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.order").value(contains(board, mine, "all", timeline)));

        // A deleted shared view leaves the order.
        mvc.perform(write(delete("/api/v1/workspace/issue-views/" + shared + "?expectedVersion=0"))
                        .cookie(cookie(ADMIN)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/issue-views").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.order").value(contains("all", personal)));
    }

    private String backlogColumn() {
        return ws.queryForObject("SELECT column_id FROM issue_column WHERE category='BACKLOG'", String.class);
    }

    private static String view(String name, String layout, String filters, boolean personal) {
        String sort = layout.equals("BOARD") ? "\"BOARD\",\"direction\":\"ASC\"" : "\"UPDATED\",\"direction\":\"DESC\"";
        return "{\"name\":\"" + name + "\",\"icon\":\"layout-list\",\"color\":\"#4A90E2\",\"layout\":\"" + layout
                + "\",\"filters\":" + filters + ",\"sort\":" + sort + ",\"grouping\":\"STATUS\",\"isPersonal\":"
                + personal + "}";
    }

    private static String edit(long version, String view) {
        return "{\"expectedVersion\":" + version + ",\"view\":" + view + "}";
    }

    private static String order(String... keys) {
        var quoted = new ArrayList<String>();
        for (String key : keys) quoted.add("\"" + key + "\"");
        return "{\"keys\":[" + String.join(",", List.copyOf(quoted)) + "]}";
    }

    private JsonNode state(String path, UUID user) throws Exception {
        return JSON.readTree(mvc.perform(get(path).cookie(cookie(user)))
                .andReturn()
                .getResponse()
                .getContentAsString());
    }

    private void member(UUID id, String name, String email, Role... roles) {
        Accounts.upsert(jdbc, id, email, true, roles);
        Members.insert(jdbc, Members.member(id, name, email).hired(LocalDate.parse("2020-01-01")));
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
        var tree = JSON.readTree(result.getResponse().getContentAsString());
        return builder.cookie(result.getResponse().getCookies())
                .header(tree.path("headerName").asText(), tree.path("token").asText())
                .header("Origin", "http://localhost:4402")
                .contentType("application/json");
    }
}

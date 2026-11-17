package xyz.goraebap.module.workspace;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import xyz.goraebap.module.workspace.support.WorkspaceTestDatabase;
import xyz.goraebap.module.workspace.project.WorkspaceRoles;
import xyz.goraebap.module.foundation.support.TestRoles;
import jakarta.servlet.http.Cookie;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import xyz.goraebap.module.foundation.user.UserFacade;
import xyz.goraebap.module.foundation.user.application.AuthSecrets;
import xyz.goraebap.module.foundation.user.application.auth.SessionService;
import xyz.goraebap.shared.persistence.InstantTextBinding;
import xyz.goraebap.shared.web.Role;
import xyz.goraebap.module.foundation.support.Accounts;
import xyz.goraebap.module.foundation.support.Members;
import xyz.goraebap.module.workspace.support.ProjectMembers;
import xyz.goraebap.module.foundation.support.TestDatabase;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Agent access: a member makes an agent token in their own session shortly after signing
 * in, sees it once and the server keeps only its hash; an agent presents it as a Bearer token to the MCP server at
 * /api/mcp, needs no CSRF token or Origin, and acts as the member through the screens' services. A token that is
 * unknown, expired or revoked, or a session cookie alone, is refused there; the REST API takes no Bearer token.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class AgentAccessTest {
    private static final UUID ADMIN = id(1);
    private static final UUID MEMBER = id(2);
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    SessionService sessions;

    @Autowired
    AuthSecrets secrets;

    @Autowired
    UserFacade userFacade;

    @LocalServerPort
    int port;

    private HttpClient client;
    private int rpc;

    @BeforeEach
    void prepare() throws Exception {
        TestDatabase.clear(jdbc);
        WorkspaceTestDatabase.seed(jdbc);
        member(ADMIN, "가관리", "admin@example.test", WorkspaceRoles.ADMIN, TestRoles.TEAM_ADMIN, Role.INSTANCE_ADMIN);
        member(MEMBER, "나구성원", "member@example.test");
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(ADMIN))
                        .content("{\"key\":\"SAFE\",\"name\":\"안전플랫폼\"}"))
                .andExpect(status().isCreated());
        ProjectMembers.editors(jdbc, "SAFE", MEMBER);
        client = HttpClient.newHttpClient();
    }

    @AfterEach
    void close() {
        client.close();
    }

    @Test
    void aTokenIsShownOnceAndOnlyItsHashIsKept() throws Exception {
        var created = createToken(cookie(MEMBER), "노트북 Claude Code", "DAYS_30");
        String secret = created.path("secret").asText();
        assertThat(secret).startsWith("goraebap_").hasSize(52);
        assertThat(created.path("token").path("prefix").asText()).isEqualTo(secret.substring(0, 14));
        assertThat(created.path("token").path("agentName").asText()).isEqualTo("Claude Code");
        assertThat(Instant.parse(created.path("token").path("expiresAt").asText()))
                .isCloseTo(Instant.now().plus(30, ChronoUnit.DAYS), within(1, ChronoUnit.MINUTES));

        String list = mvc.perform(get("/api/v1/me/agent-tokens").cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("노트북 Claude Code"))
                .andExpect(jsonPath("$[0].lastUsedAt").isEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(list).doesNotContain(secret);
        var row = jdbc.queryForMap("SELECT token_hash, prefix FROM agent_token");
        assertThat((String) row.get("token_hash")).hasSize(64).doesNotContain(secret.substring(9));
        assertThat(row.get("prefix")).isEqualTo(secret.substring(0, 14));
        // Another member does not see it.
        mvc.perform(get("/api/v1/me/agent-tokens").cookie(cookie(ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void aTokenCanBeMadeInAnOlderValidSession() throws Exception {
        var session = cookie(MEMBER);
        jdbc.update(
                "UPDATE iam_session SET created_at=?",
                InstantTextBinding.text(Instant.now().minus(11, ChronoUnit.MINUTES)));
        mvc.perform(write(post("/api/v1/me/agent-tokens"))
                        .cookie(session)
                        .content("{\"name\":\"오래된 세션\",\"agentName\":\"Claude Code\",\"lifetime\":\"NONE\"}"))
                .andExpect(status().isCreated());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM agent_token", Integer.class))
                .isEqualTo(1);
        jdbc.update(
                "UPDATE iam_session SET expires_at=?",
                InstantTextBinding.text(Instant.now().minusSeconds(1)));
        mvc.perform(write(post("/api/v1/me/agent-tokens"))
                        .cookie(session)
                        .content("{\"name\":\"만료된 세션\",\"agentName\":\"Claude Code\",\"lifetime\":\"NONE\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void anAgentListsToolsAndWorksOnIssuesAsTheMember() throws Exception {
        String token = createToken(cookie(MEMBER), "작업용", "NONE").path("secret").asText();

        var initialize = mcp(
                token,
                "initialize",
                Map.of(
                        "protocolVersion",
                        "2025-06-18",
                        "capabilities",
                        Map.of(),
                        "clientInfo",
                        Map.of("name", "test", "version", "1")));
        assertThat(initialize.statusCode()).isEqualTo(200);
        assertThat(JSON.readTree(initialize.body())
                        .path("result")
                        .path("serverInfo")
                        .path("name")
                        .asText())
                .isEqualTo("goraebap");

        var listed = mcp(token, "tools/list", Map.of());
        assertThat(listed.statusCode()).isEqualTo(200);
        var names = java.util.stream.StreamSupport.stream(
                        JSON.readTree(listed.body())
                                .path("result")
                                .path("tools")
                                .spliterator(),
                        false)
                .map(tool -> tool.path("name").asText())
                .toList();
        assertThat(names)
                .contains(
                        "whoami",
                        "list_projects",
                        "get_project",
                        "get_project_board",
                        "list_issue_types",
                        "list_issues",
                        "get_issue",
                        "create_issue",
                        "update_issue",
                        "comment_issue",
                        "set_issue_body",
                        "list_documents",
                        "get_document",
                        "create_document",
                        "update_document");

        var me = call(token, "whoami", Map.of());
        assertThat(me.path("isError").asBoolean()).isFalse();
        var whoami = JSON.readTree(text(me));
        assertThat(whoami.path("name").asText()).isEqualTo("나구성원");
        assertThat(whoami.path("agentName").asText()).isEqualTo("Claude Code");
        // Without a product profile the server gives only the general rules and adds no note to an answer.
        assertThat(JSON.readTree(initialize.body())
                        .path("result")
                        .path("instructions")
                        .asText())
                .contains("토큰 주인인 구성원의 권한으로");
        assertThat(me.path("content").size()).isEqualTo(1);
    }

    @Test
    void anAgentWritesProjectDocumentsAndReadsLibraryAsTheMember() throws Exception {
        String token =
                createToken(cookie(MEMBER), "Documents", "NONE").path("secret").asText();
        var made = JSON.readTree(text(call(
                token,
                "create_document",
                Map.of("project", "SAFE", "title", "Guide", "markdown", "## Start\n\nHello"))));
        String id = made.path("id").asText();
        assertThat(id).isNotBlank();
        var listed = JSON.readTree(text(call(token, "list_documents", Map.of("project", "SAFE"))));
        assertThat(listed.path("items").get(0).path("id").asText()).isEqualTo(id);
        var library = JSON.readTree(text(call(token, "get_document_library", Map.of("project", "SAFE"))));
        assertThat(library.path("pages").isArray()).isTrue();
        assertThat(call(token, "create_document", Map.of("title", "Shared"))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(call(token, "create_document", Map.of("project", "SAFE", "folder", "Old", "title", "Folder"))
                        .path("isError")
                        .asBoolean())
                .isTrue();
    }

    @Test
    void agentsComposeVersionedDocumentViewsAndSubpages() throws Exception {
        String admin =
                createToken(cookie(ADMIN), "문서 구성", "DAYS_90").path("secret").asText();
        String memberToken =
                createToken(cookie(MEMBER), "문서 작성", "DAYS_90").path("secret").asText();
        var label =
                JSON.readTree(text(call(admin, "create_document_label", Map.of("name", "매뉴얼", "color", "#20b2a0"))));
        String labelId = label.path("id").asText();
        assertThat(labelId).isNotBlank();
        assertThat(call(admin, "create_document_label", Map.of("name", "매뉴얼", "color", "#20b2a0"))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(call(admin, "create_document_label", Map.of("name", "잘못된 색", "color", "red"))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(call(memberToken, "create_document_label", Map.of("name", "권한 없음", "color", "#20b2a0"))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        var root = JSON.readTree(text(call(
                memberToken,
                "create_document",
                Map.of("project", "SAFE", "title", "사용자 매뉴얼", "label_ids", java.util.List.of(labelId)))));
        String rootId = root.path("id").asText();
        var child = JSON.readTree(text(call(
                memberToken,
                "create_document",
                Map.of("project", "SAFE", "title", "시작하기", "parent_id", rootId, "markdown", "로그인 안내"))));
        String childId = child.path("id").asText();
        assertThat(child.path("parentId").asText()).isEqualTo(rootId);
        assertThat(call(
                                memberToken,
                                "create_document",
                                Map.of(
                                        "project",
                                        "SAFE",
                                        "title",
                                        "라벨 오류",
                                        "parent_id",
                                        rootId,
                                        "label_ids",
                                        java.util.List.of(labelId)))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        var view = JSON.readTree(text(call(
                admin,
                "create_document_view",
                Map.of(
                        "project",
                        "SAFE",
                        "name",
                        "매뉴얼",
                        "label_ids",
                        java.util.List.of(labelId),
                        "icon",
                        "book",
                        "color",
                        "#20b2a0"))));
        String viewId = view.path("id").asText();
        assertThat(viewId).isNotBlank();
        assertThat(view.path("layout").asText()).isEqualTo("GRID");
        var update = Map.<String, Object>of(
                "project",
                "SAFE",
                "id",
                viewId,
                "name",
                "매뉴얼",
                "label_ids",
                java.util.List.of(labelId),
                "icon",
                "book",
                "color",
                "#20b2a0",
                "expectedVersion",
                view.path("version").asInt());
        assertThat(call(admin, "update_document_view", update).path("isError").asBoolean())
                .isFalse();
        assertThat(call(admin, "update_document_view", update).path("isError").asBoolean())
                .isTrue();
        assertThat(call(
                                memberToken,
                                "create_document_view",
                                Map.of("project", "SAFE", "name", "관리자만", "label_ids", java.util.List.of()))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(call(
                                admin,
                                "move_document",
                                Map.of(
                                        "project",
                                        "SAFE",
                                        "id",
                                        rootId,
                                        "parent_id",
                                        childId,
                                        "expectedVersion",
                                        root.path("version").asInt()))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(call(
                                memberToken,
                                "move_document",
                                Map.of(
                                        "project",
                                        "SAFE",
                                        "id",
                                        childId,
                                        "parent_id",
                                        "none",
                                        "expectedVersion",
                                        child.path("version").asInt()))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(call(admin, "move_document", Map.of("project", "SAFE", "id", childId, "parent_id", "none"))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        var library = JSON.readTree(text(call(admin, "get_document_library", Map.of("project", "SAFE"))));
        int orderVersion = library.path("order").path("version").asInt();
        var order = Map.<String, Object>of(
                "project",
                "SAFE",
                "parent_id",
                rootId,
                "ids",
                java.util.List.of(childId),
                "expectedVersion",
                orderVersion);
        assertThat(call(admin, "set_document_order", order).path("isError").asBoolean())
                .isFalse();
        assertThat(call(admin, "set_document_order", order).path("isError").asBoolean())
                .isTrue();
        assertThat(call(
                                admin,
                                "set_document_labels",
                                Map.of(
                                        "project",
                                        "SAFE",
                                        "id",
                                        childId,
                                        "label_ids",
                                        java.util.List.of(labelId),
                                        "expectedVersion",
                                        child.path("version").asInt()))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(call(
                                admin,
                                "set_document_labels",
                                Map.of(
                                        "project",
                                        "SAFE",
                                        "id",
                                        rootId,
                                        "label_ids",
                                        java.util.List.of(),
                                        "expectedVersion",
                                        root.path("version").asInt()))
                        .path("isError")
                        .asBoolean())
                .isFalse();
        assertThat(call(
                                admin,
                                "set_document_labels",
                                Map.of(
                                        "project",
                                        "SAFE",
                                        "id",
                                        rootId,
                                        "label_ids",
                                        java.util.List.of(labelId),
                                        "expectedVersion",
                                        root.path("version").asInt()))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        var moved = JSON.readTree(text(call(
                admin,
                "move_document",
                Map.of(
                        "project",
                        "SAFE",
                        "id",
                        childId,
                        "parent_id",
                        "none",
                        "expectedVersion",
                        child.path("version").asInt()))));
        assertThat(moved.path("version").asInt())
                .isGreaterThan(child.path("version").asInt());
        var found = JSON.readTree(text(call(memberToken, "get_document", Map.of("id", childId))));
        assertThat(found.has("parentId")).isFalse();
        assertThat(found.path("body").asText()).contains("로그인 안내");
    }

    @Test
    void documentStructureWritesRespectProjectBoundariesAndArchive() throws Exception {
        String admin =
                createToken(cookie(ADMIN), "격리 확인", "DAYS_90").path("secret").asText();
        var root = JSON.readTree(text(call(admin, "create_document", Map.of("project", "SAFE", "title", "기준 페이지"))));
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(ADMIN))
                        .content("{\"key\":\"OTHER\",\"name\":\"다른 프로젝트\"}"))
                .andExpect(status().isCreated());
        assertThat(call(
                                admin,
                                "create_document",
                                Map.of(
                                        "project",
                                        "OTHER",
                                        "title",
                                        "다른 공간",
                                        "parent_id",
                                        root.path("id").asText()))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(call(
                                admin,
                                "move_document",
                                Map.of(
                                        "project",
                                        "OTHER",
                                        "id",
                                        root.path("id").asText(),
                                        "parent_id",
                                        "none",
                                        "expectedVersion",
                                        root.path("version").asInt()))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/archive"))
                        .cookie(cookie(ADMIN))
                        .content("{\"expectedVersion\":0}"))
                .andExpect(status().isNoContent());
        assertThat(call(
                                admin,
                                "create_document_view",
                                Map.of("project", "SAFE", "name", "보관 프로젝트", "label_ids", java.util.List.of()))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(call(
                                admin,
                                "create_document",
                                Map.of(
                                        "project",
                                        "SAFE",
                                        "title",
                                        "보관 하위",
                                        "parent_id",
                                        root.path("id").asText()))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        var library = JSON.readTree(text(call(admin, "get_document_library", Map.of("project", "SAFE"))));
        assertThat(library.path("pages").size()).isEqualTo(1);
    }

    @Test
    void theMcpServerRefusesAnythingButAWorkingToken() throws Exception {
        String token =
                createToken(cookie(MEMBER), "곧 폐기", "DAYS_90").path("secret").asText();
        assertThat(mcp(token, "tools/list", Map.of()).statusCode()).isEqualTo(200);

        var unknown = mcp("goraebap_" + "x".repeat(43), "tools/list", Map.of());
        assertThat(unknown.statusCode()).isEqualTo(401);
        assertThat(unknown.headers().firstValue("WWW-Authenticate"))
                .hasValueSatisfying(value -> assertThat(value).startsWith("Bearer"));
        assertThat(JSON.readTree(unknown.body()).path("code").asText()).isEqualTo("AUTH_REQUIRED");
        assertThat(mcp("not-a-token", "tools/list", Map.of()).statusCode()).isEqualTo(401);
        assertThat(mcp(null, "tools/list", Map.of()).statusCode()).isEqualTo(401);

        // A browser's session is not an agent.
        var session = client.send(
                HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/mcp"))
                        .header("Content-Type", "application/json")
                        .header("Accept", "application/json, text/event-stream")
                        .header("Origin", "http://localhost:4402")
                        .header(
                                "Cookie",
                                "app_session=" + sessions.issue(MEMBER).token())
                        .POST(HttpRequest.BodyPublishers.ofString(
                                "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}"))
                        .build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(session.statusCode()).isEqualTo(401);

        // An expired token stops working.
        jdbc.update(
                "UPDATE agent_token SET expires_at=?",
                InstantTextBinding.text(Instant.now().minusSeconds(1)));
        assertThat(mcp(token, "tools/list", Map.of()).statusCode()).isEqualTo(401);
        jdbc.update("UPDATE agent_token SET expires_at=NULL");
        assertThat(mcp(token, "tools/list", Map.of()).statusCode()).isEqualTo(200);

        // Its owner revokes it.
        String id = jdbc.queryForObject("SELECT token_id FROM agent_token", String.class);
        mvc.perform(write(delete("/api/v1/me/agent-tokens/" + id)).cookie(cookie(ADMIN)))
                .andExpect(status().isNotFound());
        mvc.perform(write(delete("/api/v1/me/agent-tokens/" + id)).cookie(cookie(MEMBER)))
                .andExpect(status().isNoContent());
        assertThat(mcp(token, "tools/list", Map.of()).statusCode()).isEqualTo(401);
        mvc.perform(get("/api/v1/me/agent-tokens").cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void aTokenOpensNothingButTheMcpServerAndEndsWhenItsMemberLeaves() throws Exception {
        String token = createToken(cookie(MEMBER), "REST 시도", "DAYS_365")
                .path("secret")
                .asText();

        // The REST API takes the session cookie alone; a token cannot make or revoke tokens either.
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/me/agent-tokens").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/me/agent-tokens")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"name\":\"x\",\"agentName\":\"y\",\"lifetime\":\"NONE\"}"))
                .andExpect(status().isForbidden());

        userFacade.terminate(ADMIN, MEMBER);
        assertThat(jdbc.queryForObject("SELECT revoked_at FROM agent_token", String.class))
                .isNotNull();
        assertThat(mcp(token, "tools/list", Map.of()).statusCode()).isEqualTo(401);
    }

    @Test
    void issuesAnAgentWithAnExactExpiryAndLocksItsProfileAfterExpiration() throws Exception {
        var session = cookie(MEMBER);
        var seoul = ZoneId.of("Asia/Seoul");
        var expiresOn = LocalDate.now(seoul).plusDays(4);
        String input = JSON.writeValueAsString(
                Map.of("name", "개발 도우미", "icon", "agent", "color", "#2563eb", "expiresOn", expiresOn.toString()));
        var created = JSON.readTree(mvc.perform(
                        write(post("/api/v1/me/agent-tokens")).cookie(session).content(input))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString());
        assertThat(created.path("secret").asText()).startsWith("goraebap_");
        var token = created.path("token");
        assertThat(Instant.parse(token.path("expiresAt").asText()))
                .isEqualTo(expiresOn.plusDays(1).atStartOfDay(seoul).toInstant());
        String profile = token.path("profileId").asText();
        mvc.perform(get("/api/v1/me/agents").cookie(session))
                .andExpect(jsonPath("$[0].name").value("개발 도우미"));
        jdbc.update(
                "UPDATE agent_token SET expires_at=? WHERE profile_id=?",
                InstantTextBinding.text(Instant.now().minusSeconds(60)),
                profile);
        mvc.perform(write(patch("/api/v1/me/agents/" + profile))
                        .cookie(session)
                        .content("{\"expectedVersion\":0,\"name\":\"바뀐 이름\",\"icon\":\"agent\",\"color\":\"#2563eb\"}"))
                .andExpect(status().isConflict());
        mvc.perform(get("/api/v1/me/agent-tokens").cookie(session))
                .andExpect(jsonPath("$[0].expired").value(true))
                .andExpect(jsonPath("$[0].agentName").value("개발 도우미"));
    }

    @Test
    void eachAgentHasOneTokenAndShowsCurrentNameWithoutRewritingActivity() throws Exception {
        var session = cookie(MEMBER);
        var first = createToken(session, "노트북", "NONE");
        String profile = first.path("token").path("profileId").asText();
        String token = first.path("secret").asText();
        mvc.perform(write(post("/api/v1/me/agent-tokens"))
                        .cookie(session)
                        .content(JSON.writeValueAsString(
                                Map.of("name", "데스크톱", "profileId", profile, "lifetime", "NONE"))))
                .andExpect(status().isConflict());
        var second = createToken(session, "데스크톱", "NONE");
        assertThat(second.path("token").path("profileId").asText()).isNotEqualTo(profile);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM agent_profile", Integer.class))
                .isEqualTo(2);
        mvc.perform(get("/api/v1/me/agents").cookie(cookie(ADMIN)))
                .andExpect(jsonPath("$").isEmpty());
        String edit = JSON.writeValueAsString(
                Map.of("expectedVersion", 0, "name", "개발 도우미", "icon", "agent", "color", "#2563eb"));
        mvc.perform(write(patch("/api/v1/me/agents/" + profile))
                        .cookie(cookie(ADMIN))
                        .content(edit))
                .andExpect(status().isNotFound());
        mvc.perform(write(post("/api/v1/me/agent-tokens"))
                        .cookie(cookie(ADMIN))
                        .content(JSON.writeValueAsString(
                                Map.of("name", "타인 프로필", "profileId", profile, "lifetime", "NONE"))))
                .andExpect(status().isNotFound());
        call(token, "create_issue", Map.of("project", "SAFE", "title", "에이전트 기록"));
        call(token, "comment_issue", Map.of("ref", "SAFE-1", "body", "에이전트 댓글"));
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/1/comments"))
                        .cookie(session)
                        .content("{\"body\":\"직접 쓴 댓글\"}"))
                .andExpect(status().isCreated());
        mvc.perform(write(patch("/api/v1/me/agents/" + profile)).cookie(session).content(edit))
                .andExpect(status().isNoContent());
        mvc.perform(write(patch("/api/v1/me/agents/" + profile)).cookie(session).content(edit))
                .andExpect(status().isConflict());
        mvc.perform(get("/api/v1/me/agent-tokens").cookie(session))
                .andExpect(jsonPath("$[0].agentName").value("Claude Code"))
                .andExpect(jsonPath("$[1].agentName").value("개발 도우미"));
        var timeline = JSON.readTree(mvc.perform(
                        get("/api/v1/workspace/projects/SAFE/issues/1/timeline").cookie(session))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());
        var agentComment = java.util.stream.StreamSupport.stream(timeline.spliterator(), false)
                .filter(e -> e.path("body").asText().equals("에이전트 댓글"))
                .findFirst()
                .orElseThrow();
        assertThat(agentComment.path("agent").path("name").asText()).isEqualTo("개발 도우미");
        assertThat(agentComment.path("agent").path("id").asText()).isEqualTo(profile);
        assertThat(jdbc.queryForObject("SELECT actor_source FROM activity_entry WHERE body='직접 쓴 댓글'", String.class))
                .isEqualTo("USER");
        assertThat(jdbc.queryForObject(
                        "SELECT agent_profile_id FROM activity_entry WHERE body='직접 쓴 댓글'", String.class))
                .isNull();
        mvc.perform(write(delete("/api/v1/me/agent-tokens/"
                                + first.path("token").path("id").asText()))
                        .cookie(session))
                .andExpect(status().isNoContent());
        assertThat(mcp(token, "tools/list", Map.of()).statusCode()).isEqualTo(401);
        mvc.perform(write(patch("/api/v1/me/agents/" + profile)).cookie(session).content(edit))
                .andExpect(status().isConflict());
        assertThat(JSON.readTree(text(call(second.path("secret").asText(), "whoami", Map.of())))
                        .path("agentName")
                        .asText())
                .isEqualTo("Claude Code");
        assertThat(jdbc.queryForObject("SELECT agent_name FROM activity_entry WHERE body='에이전트 댓글'", String.class))
                .isEqualTo("Claude Code");
    }

    private JsonNode createToken(Cookie session, String name, String lifetime) throws Exception {
        var body = mvc.perform(write(post("/api/v1/me/agent-tokens"))
                        .cookie(session)
                        .content(JSON.writeValueAsString(
                                Map.of("name", name, "agentName", "Claude Code", "lifetime", lifetime))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JSON.readTree(body);
    }

    @Test
    void anAgentReadsAndWritesLongDocumentsAPartAtATime() throws Exception {
        String token =
                createToken(cookie(MEMBER), "부분 읽기", "NONE").path("secret").asText();
        String markdown =
                "> 요약: 로그인 방식을 정한다\n\n## 범위\n\n코드 메일 로그인\n\n## 설계\n\n### 화면\n\n코드 입력칸\n\n### 서버\n\n코드 발급\n\n## 결정\n\n메일 코드로 한다";
        var made = JSON.readTree(
                text(call(token, "create_document", Map.of("project", "SAFE", "title", "로그인", "markdown", markdown))));
        String id = made.path("id").asText();

        // A list carries each document's summary; a search shows where the words are, not the whole body.
        var listed = JSON.readTree(text(call(token, "list_documents", Map.of("project", "SAFE"))));
        assertThat(listed.path("items").get(0).path("summary").asText()).isEqualTo("로그인 방식을 정한다");
        assertThat(listed.path("items").get(0).has("excerpt")).isFalse();
        var searched = JSON.readTree(text(call(token, "list_documents", Map.of("project", "SAFE", "q", "코드 발급"))));
        assertThat(searched.path("items").get(0).path("matches").get(0).asText())
                .contains("코드 발급");

        // The outline names every section; a section reads alone, by its id or its heading's path.
        var outline = JSON.readTree(text(call(token, "get_document_outline", Map.of("id", id))));
        assertThat(outline.path("sections").findValuesAsString("id")).contains("_intro", "범위", "설계", "화면", "서버", "결정");
        assertThat(outline.path("sections").get(2).path("children").findValuesAsString("title"))
                .containsExactly("화면", "서버");
        long version = outline.path("bodyVersion").asLong();
        var screen = JSON.readTree(text(call(token, "get_document_section", Map.of("id", id, "section", "설계/화면"))));
        assertThat(screen.path("markdown").asText())
                .contains("### 화면", "코드 입력칸")
                .doesNotContain("코드 발급");
        var design = JSON.readTree(text(call(token, "get_document_section", Map.of("id", id, "section", "설계"))));
        assertThat(design.path("markdown").asText()).contains("코드 입력칸", "코드 발급").doesNotContain("메일 코드로 한다");
        var missing = call(token, "get_document_section", Map.of("id", id, "section", "없는 절"));
        assertThat(missing.path("isError").asBoolean()).isTrue();
        assertThat(text(missing)).contains("범위", "설계");

        // A section is written over the version read; one read before it moved on is refused.
        var stale = call(
                token,
                "update_document_section",
                Map.of("id", id, "section", "서버", "markdown", "옛 내용", "expectedVersion", (int) version - 1));
        assertThat(stale.path("isError").asBoolean()).isTrue();
        assertThat(text(stale)).contains("그사이 바뀌었습니다");
        var written = call(
                token,
                "update_document_section",
                Map.of("id", id, "section", "서버", "markdown", "코드는 6자리로 10분 동안 유효", "expectedVersion", (int) version));
        assertThat(written.path("isError").asBoolean()).as(text(written)).isFalse();
        var whole = JSON.readTree(text(call(token, "get_document", Map.of("id", id))))
                .path("body")
                .asText();
        assertThat(whole)
                .contains("### 서버", "코드는 6자리로 10분 동안 유효", "코드 입력칸", "메일 코드로 한다")
                .doesNotContain("코드 발급");
        var oldWhole =
                call(token, "update_document", Map.of("id", id, "markdown", "통째로", "expectedVersion", (int) version));
        assertThat(oldWhole.path("isError").asBoolean()).isTrue();

        // A section writes only its own blocks: the rest keep their ids, and a section read before another one changed
        // is still written; the same section read before it changed is refused.
        var owner = java.util.UUID.fromString(id);
        var before = jdbc.queryForList(
                "SELECT block_id FROM rich_block WHERE owner_id=? ORDER BY position", String.class, owner);
        long read = JSON.readTree(text(call(token, "get_document_outline", Map.of("id", id))))
                .path("bodyVersion")
                .asLong();
        var scope = call(
                token,
                "update_document_section",
                Map.of("id", id, "section", "범위", "markdown", "코드 메일 로그인만", "expectedVersion", (int) read));
        assertThat(scope.path("isError").asBoolean()).as(text(scope)).isFalse();
        var after = jdbc.queryForList(
                "SELECT block_id FROM rich_block WHERE owner_id=? ORDER BY position", String.class, owner);
        assertThat(after).isEqualTo(before);
        var decision = call(
                token,
                "update_document_section",
                Map.of("id", id, "section", "결정", "markdown", "메일 코드로 하고 6자리로 한다", "expectedVersion", (int) read));
        assertThat(decision.path("isError").asBoolean()).as(text(decision)).isFalse();
        var again = call(
                token,
                "update_document_section",
                Map.of("id", id, "section", "범위", "markdown", "늦은 글", "expectedVersion", (int) read));
        assertThat(again.path("isError").asBoolean()).isTrue();
        assertThat(text(again)).contains("그사이 바뀌었습니다");
        assertThat(JSON.readTree(text(call(token, "get_document", Map.of("id", id))))
                        .path("body")
                        .asText())
                .contains("코드 메일 로그인만", "메일 코드로 하고 6자리로 한다", "코드는 6자리로 10분 동안 유효")
                .doesNotContain("늦은 글");

        // A block moved into a section since it was read refuses the write there too (a move is a change of the
        // section), so the agent's Markdown, which never had it, does not delete it.
        long moved = JSON.readTree(text(call(token, "get_document_outline", Map.of("id", id))))
                .path("bodyVersion")
                .asLong();
        var order = new java.util.ArrayList<>(jdbc.queryForList(
                "SELECT block_id FROM rich_block WHERE owner_id=? ORDER BY position", String.class, owner));
        String last = order.removeLast();
        order.add(order.indexOf(after.get(1)) + 1, last);
        mvc.perform(write(patch("/api/v1/workspace/documents/" + id + "/body"))
                        .cookie(cookie(MEMBER))
                        .content(JSON.writeValueAsString(Map.of(
                                "order", order,
                                "puts", java.util.List.of(),
                                "deletes", java.util.List.of(),
                                "uploadIds", java.util.List.of(),
                                "checkpoint", false))))
                .andExpect(status().isOk());
        var intoMoved = call(
                token,
                "update_document_section",
                Map.of("id", id, "section", "범위", "markdown", "옮겨 온 블록을 모르는 글", "expectedVersion", (int) moved));
        assertThat(intoMoved.path("isError").asBoolean()).isTrue();
        assertThat(jdbc.queryForList(
                        "SELECT block_id FROM rich_block WHERE owner_id=? ORDER BY position", String.class, owner))
                .contains(last);
    }

    @Test
    void typeDiscoveryUsesCurrentNamesDefaultsAndCustomCodes() throws Exception {
        String location = mvc.perform(write(post("/api/v1/workspace/work-item-types"))
                        .cookie(cookie(ADMIN))
                        .content("{\"name\":\"기술 검토\",\"icon\":\"document\",\"color\":\"#4cb782\",\"isDefault\":true}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");
        String code = java.util.Objects.requireNonNull(location).substring(location.lastIndexOf('/') + 1);
        String token =
                createToken(cookie(MEMBER), "유형 확인", "NONE").path("secret").asText();
        var types =
                JSON.readTree(text(call(token, "list_issue_types", Map.of()))).path("types");
        assertThat(types.findValuesAsString("name")).contains("기술 검토", "스토리", "기능");
        assertThat(types.get(types.size() - 1).path("code").asText()).isEqualTo(code);
        assertThat(types.get(types.size() - 1).path("isDefault").asBoolean()).isTrue();
        assertThat(types.get(0).path("isDefault").asBoolean()).isFalse();

        call(token, "create_issue", Map.of("project", "SAFE", "title", "설정 검토", "type", code));
        assertThat(JSON.readTree(text(call(token, "get_issue", Map.of("ref", "SAFE-1"))))
                        .path("type")
                        .asText())
                .isEqualTo("기술 검토");
        call(token, "update_issue", Map.of("ref", "SAFE-1", "type", "스토리"));
        assertThat(JSON.readTree(text(call(token, "get_issue", Map.of("ref", "SAFE-1"))))
                        .path("type")
                        .asText())
                .isEqualTo("스토리");

        mvc.perform(write(patch(location))
                        .cookie(cookie(ADMIN))
                        .content("{\"name\":\"설계 검토\",\"icon\":\"document\",\"color\":\"#4cb782\",\"isDefault\":true}"))
                .andExpect(status().isNoContent());
        var renamed =
                JSON.readTree(text(call(token, "list_issue_types", Map.of()))).path("types");
        assertThat(renamed.findValuesAsString("name")).contains("설계 검토").doesNotContain("기술 검토");
        assertThat(mcp(null, "tools/call", Map.of("name", "list_issue_types", "arguments", Map.of()))
                        .statusCode())
                .isEqualTo(401);
    }

    @Test
    void anAgentPlansEffortAndLogsTheTimeItSpent() throws Exception {
        String token =
                createToken(cookie(MEMBER), "공수 기록", "NONE").path("secret").asText();
        var made = JSON.readTree(text(call(
                token,
                "create_issue",
                Map.of("project", "SAFE", "title", "보고서 내보내기", "estimate_hours", 4, "story_points", "2"))));
        assertThat(made.path("estimateHours").asDouble()).isEqualTo(4.0);
        assertThat(made.path("storyPoints").asDouble()).isEqualTo(2.0);
        var logged = JSON.readTree(
                text(call(token, "log_time", Map.of("ref", "SAFE-1", "hours", 1.25, "note", "CSV 형식 정리"))));
        assertThat(logged.path("spentHours").asDouble()).isEqualTo(1.25);
        var cleared = JSON.readTree(text(
                call(token, "update_issue", Map.of("ref", "SAFE-1", "estimate_hours", 0, "story_points", "none"))));
        assertThat(cleared.has("estimateHours")).isFalse();
        assertThat(cleared.has("storyPoints")).isFalse();
        assertThat(cleared.path("spentHours").asDouble()).isEqualTo(1.25);
    }

    @Test
    void anAgentPutsWorkItemsInCyclesByName() throws Exception {
        String token = createToken(cookie(MEMBER), "사이클", "NONE").path("secret").asText();
        var today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Seoul"));
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/cycles"))
                        .cookie(cookie(MEMBER))
                        .content("{\"name\":\"스프린트 3\",\"startDate\":\"" + today + "\",\"endDate\":\""
                                + today.plusDays(13) + "\"}"))
                .andExpect(status().isCreated());
        var made = JSON.readTree(text(call(
                token,
                "create_issue",
                Map.of("project", "SAFE", "title", "로그 정리", "cycle", "current", "story_points", "3"))));
        assertThat(made.path("cycle").asText()).isEqualTo("스프린트 3");
        var cycles = JSON.readTree(text(call(token, "list_cycles", Map.of("project", "SAFE"))))
                .path("cycles");
        assertThat(cycles.get(0).path("state").asText()).isEqualTo("current");
        assertThat(cycles.get(0).path("storyPoints").asDouble()).isEqualTo(3.0);
        var listed = JSON.readTree(text(call(token, "list_issues", Map.of("project", "SAFE", "cycle", "스프린트 3"))));
        assertThat(listed.path("items").findValuesAsString("ref")).containsExactly("SAFE-1");
        var moved = JSON.readTree(text(call(token, "update_issue", Map.of("ref", "SAFE-1", "cycle", "none"))));
        assertThat(moved.has("cycle")).isFalse();
        var wrong = call(token, "update_issue", Map.of("ref", "SAFE-1", "cycle", "없는 사이클"));
        assertThat(wrong.path("isError").asBoolean()).isTrue();
    }

    @Test
    void anAgentReadsIssuesInShortRowsAndPagesAndAsksWhatChanged() throws Exception {
        String token =
                createToken(cookie(MEMBER), "변경 읽기", "NONE").path("secret").asText();
        var start = JSON.readTree(text(call(token, "changes_since", Map.of())))
                .path("cursor")
                .asText();
        call(token, "create_issue", Map.of("project", "SAFE", "title", "로그인 화면", "assignee", "me"));
        for (int index = 1; index <= 3; index++)
            call(token, "comment_issue", Map.of("ref", "SAFE-1", "body", "진행 " + index));

        // Lists are short rows: no empty fields, no body.
        var listed = JSON.readTree(text(call(token, "list_issues", Map.of("assignee", "me"))));
        var row = listed.path("items").get(0);
        assertThat(row.path("ref").asText()).isEqualTo("SAFE-1");
        assertThat(row.path("status").asText()).isNotEmpty();
        assertThat(row.has("path")).isFalse();
        assertThat(row.has("labels")).isFalse();
        var later = JSON.readTree(text(call(token, "list_issues", Map.of("updated_since", "2999-01-01"))));
        assertThat(later.path("items")).isEmpty();
        var all = JSON.readTree(text(call(token, "list_issues", Map.of("status", "all"))));
        assertThat(all.path("items").findValuesAsString("ref")).containsExactly("SAFE-1");

        // The timeline comes the latest first in pages; a reply names the comment it answers.
        var first = JSON.readTree(text(call(token, "get_issue", Map.of("ref", "SAFE-1", "timeline_size", 2))));
        assertThat(first.path("timeline")).hasSize(2);
        assertThat(first.path("timeline").get(1).path("comment").asText()).isEqualTo("진행 3");
        String cursor = first.path("timelineCursor").asText();
        var earlier = JSON.readTree(
                text(call(token, "get_issue", Map.of("ref", "SAFE-1", "timeline_size", 2, "timeline_before", cursor))));
        assertThat(earlier.path("timeline").get(1).path("comment").asText()).isEqualTo("진행 1");
        String commentId = first.path("timeline").get(0).path("id").asText();
        var replied = call(token, "comment_issue", Map.of("ref", "SAFE-1", "body", "확인", "reply_to", commentId));
        assertThat(replied.path("isError").asBoolean()).as(text(replied)).isFalse();
        var reread = JSON.readTree(text(call(token, "get_issue", Map.of("ref", "SAFE-1", "timeline_size", 1))));
        assertThat(reread.path("timeline").get(0).path("replyTo").asText()).isEqualTo(commentId);

        // What changed since the first cursor: the issue and the document made after it, and a new cursor.
        call(token, "create_document", Map.of("project", "SAFE", "title", "새 결정"));
        var changes = JSON.readTree(text(call(token, "changes_since", Map.of("since", start))));
        assertThat(changes.path("issues").findValuesAsString("ref")).containsExactly("SAFE-1");
        assertThat(changes.path("issues").get(0).path("change").asText()).isEqualTo("created");
        assertThat(changes.path("documents").findValuesAsString("title")).containsExactly("새 결정");
        var none = JSON.readTree(text(call(
                token, "changes_since", Map.of("since", changes.path("cursor").asText()))));
        assertThat(none.path("issues")).isEmpty();
        assertThat(none.path("documents")).isEmpty();
    }

    @Test
    void anAgentSeesOnlyTheProjectsItsMemberIsIn() throws Exception {
        UUID outsider = UUID.fromString("00000000-0000-0000-0000-000000000099");
        member(outsider, "마바깥", "outsider@example.test");
        String member =
                createToken(cookie(MEMBER), "멤버의 에이전트", "NONE").path("secret").asText();
        String other =
                createToken(cookie(outsider), "바깥의 에이전트", "NONE").path("secret").asText();
        var start = JSON.readTree(text(call(other, "changes_since", Map.of())))
                .path("cursor")
                .asText();
        call(member, "create_issue", Map.of("project", "SAFE", "title", "멤버만 보는 이슈"));

        // The agent of who is not a member finds nothing of the project, as its member would on the screen.
        assertThat(JSON.readTree(text(call(other, "list_issues", Map.of("status", "all"))))
                        .path("items"))
                .isEmpty();
        assertThat(call(other, "get_issue", Map.of("ref", "SAFE-1"))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(call(other, "comment_issue", Map.of("ref", "SAFE-1", "body", "몰래"))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(JSON.readTree(text(call(other, "changes_since", Map.of("since", start))))
                        .path("issues"))
                .isEmpty();
    }

    @Test
    void changePagesKeepDeletesAndBodySummariesWithoutSkippingTheSnapshot() throws Exception {
        String token =
                createToken(cookie(MEMBER), "변경 조각", "NONE").path("secret").asText();
        String adminToken =
                createToken(cookie(ADMIN), "권한 검증", "NONE").path("secret").asText();
        String since = Instant.now().minusSeconds(1).toString();
        for (int i = 0; i < 5; i++) {
            call(token, "create_issue", Map.of("project", "SAFE", "title", "조각 " + i));
            call(token, "create_document", Map.of("project", "SAFE", "title", "자료 " + i));
        }
        var summary = JSON.readTree(text(call(
                token,
                "create_document",
                Map.of("project", "SAFE", "title", "요약 검증", "markdown", "배경 ".repeat(100) + "\n\n요약: 실제 본문 요약"))));
        var listed = JSON.readTree(text(call(token, "list_documents", Map.of("project", "SAFE", "q", "요약 검증"))));
        assertThat(listed.path("items").get(0).path("summary").asText()).isEqualTo("실제 본문 요약");
        String deletedDoc = JSON.readTree(
                        text(call(token, "create_document", Map.of("project", "SAFE", "title", "지울 자료"))))
                .path("id")
                .asText();
        mvc.perform(write(delete("/api/v1/workspace/documents/" + deletedDoc).param("expectedVersion", "0"))
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isNoContent());
        mvc.perform(write(delete("/api/v1/workspace/projects/SAFE/issues/1").param("expectedVersion", "0"))
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isNoContent());
        String hidden = JSON.readTree(
                        text(call(adminToken, "create_document", Map.of("project", "SAFE", "title", "비공개 자료"))))
                .path("id")
                .asText();
        mvc.perform(write(put("/api/v1/workspace/documents/" + hidden + "/access"))
                        .cookie(cookie(ADMIN))
                        .content("{\"grants\":[{\"subject\":\"OWNER\",\"level\":\"MANAGE\"}]}"))
                .andExpect(status().isNoContent());
        mvc.perform(write(delete("/api/v1/workspace/documents/" + hidden).param("expectedVersion", "0"))
                        .cookie(cookie(ADMIN)))
                .andExpect(status().isNoContent());
        String inFolder = JSON.readTree(
                        text(call(token, "create_document", Map.of("project", "SAFE", "title", "Removed document"))))
                .path("id")
                .asText();
        mvc.perform(write(delete("/api/v1/workspace/documents/" + inFolder).param("expectedVersion", "0"))
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isNoContent());
        String cursor = since;
        var refs = new java.util.HashSet<String>();
        var docs = new java.util.HashSet<String>();
        int deleted = 0;
        int pages = 0;
        do {
            var changes = JSON.readTree(
                    text(call(token, "changes_since", Map.of("project", "SAFE", "since", cursor, "size", 2))));
            for (var row : changes.path("issues")) {
                assertThat(refs.add(row.path("ref").asText())).isTrue();
                if (row.path("change").asText().equals("deleted")) {
                    deleted++;
                    assertThat(row.has("title")).isFalse();
                }
            }
            for (var row : changes.path("documents")) {
                assertThat(docs.add(row.path("id").asText())).isTrue();
                if (row.path("change").asText().equals("deleted")) {
                    deleted++;
                    assertThat(row.has("title")).isFalse();
                }
            }
            cursor = changes.path("cursor").asText();
            if (++pages > 10) throw new AssertionError("변경 조각이 끝나지 않음");
            if (!changes.path("hasMore").asBoolean()) break;
            var wrongScope = call(token, "changes_since", Map.of("since", cursor, "size", 2));
            assertThat(wrongScope.path("isError").asBoolean()).isTrue();
        } while (true);
        assertThat(refs).hasSize(5);
        assertThat(docs)
                .hasSize(8)
                .doesNotContain(hidden)
                .contains(deletedDoc, summary.path("id").asText());
        assertThat(deleted).isEqualTo(3);
        assertThat(pages).isGreaterThan(1);
        var none = JSON.readTree(text(call(token, "changes_since", Map.of("project", "SAFE", "since", cursor))));
        assertThat(none.path("issues")).isEmpty();
        assertThat(none.path("documents")).isEmpty();
    }

    @Test
    void anAgentReadsADocumentsCommentsRepliesToThemAndHearsOfNewOnes() throws Exception {
        String token =
                createToken(cookie(MEMBER), "문서 댓글", "NONE").path("secret").asText();
        String document = JSON.readTree(text(call(
                        token,
                        "create_document",
                        Map.of("project", "SAFE", "title", "5. 구성 요소 뷰", "markdown", "인증 모듈이 토큰을 발급한다."))))
                .path("id")
                .asText();
        String since = Instant.now().toString();

        // A member asks for a change in a comment on the screen, quoting the body.
        String request = location(mvc.perform(write(post("/api/v1/workspace/documents/" + document + "/comments"))
                .cookie(cookie(ADMIN))
                .content("{\"body\":\"발급 주체를 인증 서버로 고쳐 주세요\",\"quote\":\"인증 모듈이 토큰을 발급한다.\"}")));

        // Only a comment came: the document is in changes_since, told apart from a change of its body.
        var changes = JSON.readTree(text(call(token, "changes_since", Map.of("project", "SAFE", "since", since))));
        var changed = changes.path("documents");
        assertThat(changed.findValuesAsString("id")).containsExactly(document);
        assertThat(changed.get(0).path("change").asText()).isEqualTo("commented");
        assertThat(changed.get(0).path("commentedAt").asText()).isNotEmpty();

        // get_document shows the comment as the screen does: who, when, the words it quotes.
        var read = JSON.readTree(text(call(token, "get_document", Map.of("id", document))));
        var comments = java.util.stream.StreamSupport.stream(
                        read.path("timeline").spliterator(), false)
                .filter(entry -> entry.has("comment"))
                .toList();
        assertThat(comments).hasSize(1);
        assertThat(comments.getFirst().path("id").asText()).isEqualTo(request);
        assertThat(comments.getFirst().path("by").asText()).isEqualTo("가관리");
        assertThat(comments.getFirst().path("quote").asText()).isEqualTo("인증 모듈이 토큰을 발급한다.");
        assertThat(comments.getFirst().path("at").asText()).isNotEmpty();
        assertThat(read.path("timelineTotal").asInt())
                .isEqualTo(read.path("timeline").size());
        var without =
                JSON.readTree(text(call(token, "get_document", Map.of("id", document, "include_timeline", false))));
        assertThat(without.has("timeline")).isFalse();

        // The agent replies under that comment, as itself, and the screen shows it there.
        var replied = call(
                token, "comment_document", Map.of("id", document, "body", "반영했습니다: 인증 서버가 발급", "reply_to", request));
        assertThat(replied.path("isError").asBoolean()).as(text(replied)).isFalse();
        var timeline = JSON.readTree(mvc.perform(get("/api/v1/workspace/documents/" + document + "/timeline")
                        .cookie(cookie(ADMIN)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());
        var reply = java.util.stream.StreamSupport.stream(timeline.spliterator(), false)
                .filter(entry -> entry.path("body").asText().startsWith("반영했습니다"))
                .findFirst()
                .orElseThrow();
        assertThat(reply.path("parentId").asText()).isEqualTo(request);
        assertThat(reply.path("actorName").asText()).isEqualTo("나구성원");
        assertThat(reply.path("agent").path("name").asText()).isEqualTo("Claude Code");
        var reread = JSON.readTree(text(call(token, "get_document", Map.of("id", document, "timeline_size", 1))));
        assertThat(reread.path("timeline").get(0).path("replyTo").asText()).isEqualTo(request);
        assertThat(reread.path("timeline").get(0).path("agent").path("name").asText())
                .isEqualTo("Claude Code");
        assertThat(reread.path("timelineCursor").asText()).isNotEmpty();
        var tooLong = call(token, "comment_document", Map.of("id", document, "body", "가".repeat(10_001)));
        assertThat(tooLong.path("isError").asBoolean()).isTrue();

        // A document the member may not read: its comments are neither read nor written, nor heard of.
        String hidden = JSON.readTree(text(call(
                        createToken(cookie(ADMIN), "관리 도우미", "NONE")
                                .path("secret")
                                .asText(),
                        "create_document",
                        Map.of("project", "SAFE", "title", "비공개 설계"))))
                .path("id")
                .asText();
        mvc.perform(write(put("/api/v1/workspace/documents/" + hidden + "/access"))
                        .cookie(cookie(ADMIN))
                        .content("{\"grants\":[{\"subject\":\"OWNER\",\"level\":\"MANAGE\"}]}"))
                .andExpect(status().isNoContent());
        String secret = location(mvc.perform(write(post("/api/v1/workspace/documents/" + hidden + "/comments"))
                .cookie(cookie(ADMIN))
                .content("{\"body\":\"비공개 요청\"}")));
        assertThat(call(token, "get_document", Map.of("id", hidden))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(call(token, "comment_document", Map.of("id", hidden, "body", "몰래", "reply_to", secret))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM activity_entry WHERE body='몰래'", Integer.class))
                .isZero();
        var after = JSON.readTree(text(call(token, "changes_since", Map.of("project", "SAFE", "since", since))));
        assertThat(after.path("documents").findValuesAsString("id")).containsExactly(document);
    }

    @Test
    void agentUploadsAnImageAndPreservesLayoutWithExplicitDeletionAndPermissions() throws Exception {
        String token =
                createToken(cookie(MEMBER), "첨부 검증", "NONE").path("secret").asText();
        byte[] png = java.util.Base64.getDecoder()
                .decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6L1sAAAAASUVORK5CYII=");
        var ticket = JSON.readTree(text(call(
                token,
                "prepare_file_upload",
                Map.of("filename", "화면.png", "size", png.length, "width", 1, "height", 1))));
        assertThat(ticket.path("url").asText()).startsWith("http://localhost:");
        assertThat(ticket.path("curl").asText())
                .contains("--data-binary", ticket.path("url").asText());
        var upload = HttpRequest.newBuilder(URI.create(ticket.path("url").asText()));
        ticket.path("headers")
                .properties()
                .forEach(h -> upload.header(h.getKey(), h.getValue().asText()));
        assertThat(client.send(
                                upload.method(
                                                ticket.path("method").asText(),
                                                HttpRequest.BodyPublishers.ofByteArray(png))
                                        .build(),
                                HttpResponse.BodyHandlers.ofString())
                        .statusCode())
                .isBetween(200, 299);
        String markdown = "## 화면\n\n" + ticket.path("markdown").asText()
                + "\n\n<details open>\n<summary>안내</summary>\n\n설명\n\n</details>";
        var created =
                call(token, "create_document", Map.of("project", "SAFE", "title", "이미지 검증", "markdown", markdown));
        assertThat(created.path("isError").asBoolean()).as(text(created)).isFalse();
        String id = JSON.readTree(text(created)).path("id").asText();
        var body = JSON.readTree(
                mvc.perform(get("/api/v1/workspace/documents/" + id + "/body").cookie(cookie(MEMBER)))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString());
        assertThat(body.at("/body/content/1/type").asText()).isEqualTo("media");
        assertThat(body.at("/body/content/1/attrs/mime").asText()).isEqualTo("image/png");
        assertThat(body.at("/body/content/1/attrs/size").asInt()).isEqualTo(png.length);
        assertThat(body.at("/body/content/1/attrs/pixelWidth").asInt()).isEqualTo(1);
        var rich = (tools.jackson.databind.node.ObjectNode) body.path("body");
        ((tools.jackson.databind.node.ObjectNode) rich.at("/content/1/attrs")).put("width", 50);
        var columns = JSON.readTree(
                "{\"type\":\"columns\",\"attrs\":{\"blockId\":\"layout\"},\"content\":[{\"type\":\"column\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"남겨둘 내용\"}]}]},{\"type\":\"column\",\"content\":[{\"type\":\"paragraph\"}]}]}");
        ((tools.jackson.databind.node.ArrayNode) rich.path("content")).add(columns);
        mvc.perform(write(put("/api/v1/workspace/documents/" + id + "/body"))
                        .cookie(cookie(MEMBER))
                        .content(JSON.writeValueAsString(Map.of(
                                "body",
                                rich,
                                "expectedVersion",
                                body.path("version").asInt(),
                                "uploadIds",
                                java.util.List.of(),
                                "checkpoint",
                                true))))
                .andExpect(status().isOk());
        var read = JSON.readTree(text(call(token, "get_document", Map.of("id", id))));
        String exported = read.path("body").asText();
        assertThat(exported).contains("<!-- block:layout -->", "<details open>");
        var updated = call(
                token,
                "update_document",
                Map.of(
                        "id",
                        id,
                        "markdown",
                        exported.replace("설명", "바뀐 설명"),
                        "expectedVersion",
                        read.path("bodyVersion").asInt()));
        assertThat(updated.path("isError").asBoolean()).as(text(updated)).isFalse();
        var after = JSON.readTree(
                mvc.perform(get("/api/v1/workspace/documents/" + id + "/body").cookie(cookie(MEMBER)))
                        .andReturn()
                        .getResponse()
                        .getContentAsString());
        assertThat(after.at("/body/content/1/attrs/width").asInt()).isEqualTo(50);
        assertThat(after.at("/body/content/3")).isEqualTo(columns);
        var omitted = call(
                token,
                "update_document",
                Map.of("id", id, "title", "실패하면 바뀌지 않음", "markdown", exported.replace("<!-- block:layout -->", "")));
        assertThat(omitted.path("isError").asBoolean()).isTrue();
        assertThat(text(omitted)).contains("RICH_BODY_BLOCKS_MISSING", "layout", "남겨둘 내용");
        assertThat(JSON.readTree(text(call(token, "get_document", Map.of("id", id))))
                        .path("title")
                        .asText())
                .isEqualTo("이미지 검증");
        var dropped = call(
                token,
                "update_document",
                Map.of(
                        "id",
                        id,
                        "markdown",
                        exported.replace("<!-- block:layout -->", ""),
                        "drop_blocks",
                        java.util.List.of("layout")));
        assertThat(dropped.path("isError").asBoolean()).as(text(dropped)).isFalse();
        // Already-bound files cannot be borrowed by another document, even by the same agent.
        assertThat(call(
                                token,
                                "create_document",
                                Map.of(
                                        "project",
                                        "SAFE",
                                        "title",
                                        "남의 첨부",
                                        "markdown",
                                        ticket.path("markdown").asText()))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(call(token, "prepare_file_upload", Map.of("filename", "too-big.png", "size", 10 * 1024 * 1024 + 1))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(call(token, "prepare_file_upload", Map.of("filename", "audio.mp3", "size", 100))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(call(token, "prepare_file_upload", Map.of("filename", "fake.svg", "size", 100))
                        .path("isError")
                        .asBoolean())
                .isTrue();
    }

    @Test
    void issueStatusAndReportAreAtomicAndCanceledIsAvailable() throws Exception {
        String token =
                createToken(cookie(MEMBER), "보고 검증", "NONE").path("secret").asText();
        String ref = JSON.readTree(text(call(token, "create_issue", Map.of("project", "SAFE", "title", "보고 작업"))))
                .path("ref")
                .asText();
        var canceled =
                call(token, "update_issue", Map.of("ref", ref, "status", "canceled", "comment", "필요가 없어 취소합니다."));
        assertThat(canceled.path("isError").asBoolean()).as(text(canceled)).isFalse();
        var read = JSON.readTree(text(call(token, "get_issue", Map.of("ref", ref))));
        assertThat(read.path("category").asText()).isEqualTo("canceled");
        assertThat(read.path("timeline").findValuesAsString("comment")).contains("필요가 없어 취소합니다.");
        var invalid =
                call(token, "update_issue", Map.of("ref", ref, "status", "completed", "comment", "x".repeat(10001)));
        assertThat(invalid.path("isError").asBoolean()).isTrue();
        assertThat(JSON.readTree(text(call(token, "get_issue", Map.of("ref", ref))))
                        .path("category")
                        .asText())
                .isEqualTo("canceled");
    }

    @Test
    void pendingUploadsCannotBeTakenByOthersAfterExpiryOrWithoutWritePermission() throws Exception {
        String admin =
                createToken(cookie(ADMIN), "관리 첨부", "NONE").path("secret").asText();
        String member =
                createToken(cookie(MEMBER), "첨부 소유권", "NONE").path("secret").asText();
        var upload =
                JSON.readTree(text(call(admin, "prepare_file_upload", Map.of("filename", "pending.png", "size", 100))));
        var foreign = call(
                member,
                "create_document",
                Map.of(
                        "project",
                        "SAFE",
                        "title",
                        "가져올 수 없음",
                        "markdown",
                        upload.path("markdown").asText()));
        assertThat(foreign.path("isError").asBoolean()).isTrue();
        assertThat(text(foreign)).contains("RICH_BODY_FILE_UNKNOWN");
        jdbc.update(
                "UPDATE pending_upload SET created_at=? WHERE pending_upload_id=?",
                InstantTextBinding.text(Instant.now().minus(2, ChronoUnit.DAYS)),
                upload.path("uploadId").asText());
        var expired = call(
                admin,
                "create_document",
                Map.of(
                        "project",
                        "SAFE",
                        "title",
                        "만료됨",
                        "markdown",
                        upload.path("markdown").asText()));
        assertThat(expired.path("isError").asBoolean()).isTrue();
        assertThat(text(expired)).contains("RICH_BODY_FILE_UNKNOWN");
        String hidden = JSON.readTree(
                        text(call(admin, "create_document", Map.of("project", "SAFE", "title", "관리자 문서"))))
                .path("id")
                .asText();
        mvc.perform(write(put("/api/v1/workspace/documents/" + hidden + "/access"))
                        .cookie(cookie(ADMIN))
                        .content("{\"grants\":[{\"subject\":\"OWNER\",\"level\":\"MANAGE\"}]}"))
                .andExpect(status().isNoContent());
        var own = JSON.readTree(text(call(member, "prepare_file_upload", Map.of("filename", "own.png", "size", 100))));
        var denied = call(
                member,
                "update_document",
                Map.of("id", hidden, "markdown", own.path("markdown").asText()));
        assertThat(denied.path("isError").asBoolean()).isTrue();
        assertThat(text(denied)).contains("DOCUMENT_NOT_FOUND");
        assertThat(jdbc.queryForObject(
                        "SELECT count(*) FROM pending_upload WHERE pending_upload_id=?",
                        Integer.class,
                        own.path("uploadId").asText()))
                .isEqualTo(1);
    }

    @Test
    void documentDeletionPreviewsByDefaultAndDeletesTheWholeSubtreeOnlyWhenExplicit() throws Exception {
        String token =
                createToken(cookie(MEMBER), "문서 삭제", "NONE").path("secret").asText();
        String root = deletionDocument(token, "삭제할 루트", null);
        String child = deletionDocument(token, "하위", root);
        String grandchild = deletionDocument(token, "손자", child);
        String kept = deletionDocument(token, "보존", null);
        var arguments = Map.<String, Object>of("project", "SAFE", "id", root, "expectedVersion", 0);
        var preview = JSON.readTree(text(call(token, "delete_document", arguments)));
        assertThat(preview.path("status").asText()).isEqualTo("preview");
        assertThat(preview.path("affectedCount").asInt()).isEqualTo(3);
        assertThat(preview.path("documents").findValuesAsString("id"))
                .containsExactlyInAnyOrder(root, child, grandchild);
        assertThat(call(token, "get_document", Map.of("id", root))
                        .path("isError")
                        .asBoolean())
                .isFalse();
        var execute = new java.util.HashMap<>(arguments);
        execute.put("dry_run", false);
        var deleted = JSON.readTree(text(call(token, "delete_document", execute)));
        assertThat(deleted.path("status").asText()).isEqualTo("deleted");
        assertThat(deleted.path("affectedCount").asInt()).isEqualTo(3);
        for (String id : java.util.List.of(root, child, grandchild)) {
            assertThat(call(token, "get_document", Map.of("id", id))
                            .path("isError")
                            .asBoolean())
                    .isTrue();
            assertThat(jdbc.queryForObject(
                            "SELECT count(*) FROM document WHERE document_id=? AND deleted_at IS NOT NULL",
                            Integer.class,
                            id))
                    .isEqualTo(1);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM rich_body WHERE owner_id=?", Integer.class, id))
                    .isEqualTo(1);
        }
        assertThat(call(token, "get_document", Map.of("id", kept))
                        .path("isError")
                        .asBoolean())
                .isFalse();
        assertThat(text(call(token, "delete_document", execute))).contains("DOCUMENT_NOT_FOUND");
        var tools = JSON.readTree(mcp(token, "tools/list", Map.of()).body())
                .path("result")
                .path("tools");
        for (String name : java.util.List.of("delete_document", "delete_documents")) {
            var tool = java.util.stream.StreamSupport.stream(tools.spliterator(), false)
                    .filter(t -> name.equals(t.path("name").asText()))
                    .findFirst()
                    .orElseThrow();
            assertThat(tool.path("annotations").path("destructiveHint").asBoolean())
                    .isTrue();
            assertThat(tool.path("annotations").path("readOnlyHint").asBoolean())
                    .isFalse();
        }
    }

    @Test
    void bulkDeletionReturnsIndependentFailuresAndContinuesAfterThem() throws Exception {
        String member =
                createToken(cookie(MEMBER), "다중 삭제", "NONE").path("secret").asText();
        String admin =
                createToken(cookie(ADMIN), "권한 비교", "NONE").path("secret").asText();
        String first = deletionDocument(member, "성공 1", null);
        String stale = deletionDocument(member, "버전 충돌", null);
        String forbidden = deletionDocument(admin, "다른 사람이 만든 문서", null);
        String hidden = deletionDocument(admin, "숨긴 제목을 공개하지 않음", null);
        String last = deletionDocument(member, "성공 2", null);
        mvc.perform(write(put("/api/v1/workspace/documents/" + hidden + "/access"))
                        .cookie(cookie(ADMIN))
                        .content("{\"grants\":[{\"subject\":\"OWNER\",\"level\":\"MANAGE\"}]}"))
                .andExpect(status().isNoContent());
        var targets = java.util.List.of(
                Map.of("id", first, "expectedVersion", 0),
                Map.of("id", stale, "expectedVersion", 1),
                Map.of("id", forbidden, "expectedVersion", 0),
                Map.of("id", hidden, "expectedVersion", 0),
                Map.of("id", UUID.randomUUID().toString(), "expectedVersion", 0),
                Map.of("id", last, "expectedVersion", 0));
        var dry =
                JSON.readTree(text(call(member, "delete_documents", Map.of("project", "SAFE", "documents", targets))));
        assertThat(dry.path("succeeded").asInt()).isEqualTo(2);
        assertThat(call(member, "get_document", Map.of("id", first))
                        .path("isError")
                        .asBoolean())
                .isFalse();
        var result =
                call(member, "delete_documents", Map.of("project", "SAFE", "documents", targets, "dry_run", false));
        assertThat(result.path("isError").asBoolean()).as(text(result)).isFalse();
        var body = JSON.readTree(text(result));
        assertThat(body.path("succeeded").asInt()).isEqualTo(2);
        assertThat(body.path("failed").asInt()).isEqualTo(4);
        assertThat(body.path("results").findValuesAsString("status"))
                .containsExactly("deleted", "failed", "failed", "failed", "failed", "deleted");
        assertThat(body.path("results").findValuesAsString("code"))
                .containsExactly(
                        "DOCUMENT_VERSION_CONFLICT", "AUTH_FORBIDDEN", "DOCUMENT_NOT_FOUND", "DOCUMENT_NOT_FOUND");
        assertThat(text(result)).doesNotContain("숨긴 제목을 공개하지 않음");
        for (String id : java.util.List.of(stale, forbidden))
            assertThat(call(member, "get_document", Map.of("id", id))
                            .path("isError")
                            .asBoolean())
                    .isFalse();
        for (String id : java.util.List.of(first, last))
            assertThat(call(member, "get_document", Map.of("id", id))
                            .path("isError")
                            .asBoolean())
                    .isTrue();
    }

    @Test
    void invalidBulkSelectionsAreRejectedBeforeDeletingAnything() throws Exception {
        String token =
                createToken(cookie(MEMBER), "삭제 입력 검증", "NONE").path("secret").asText();
        String root = deletionDocument(token, "루트", null);
        String child = deletionDocument(token, "하위", root);
        var good = Map.of("id", root, "expectedVersion", 0);
        var cases = java.util.List.of(
                java.util.List.of(),
                java.util.List.of(good, good),
                java.util.List.of(good, Map.of("id", child, "expectedVersion", 0)),
                java.util.List.of(good, Map.of("id", child, "expectedVersion", 0.5)),
                java.util.List.of(good, Map.of("id", child, "expectedVersion", -1)),
                java.util.List.of(good, Map.of("id", "invalid", "expectedVersion", 0)),
                java.util.List.of(good, Map.of("id", child)),
                java.util.List.of("not-an-object"),
                java.util.Collections.nCopies(101, good));
        for (var targets : cases) {
            var result =
                    call(token, "delete_documents", Map.of("project", "SAFE", "documents", targets, "dry_run", false));
            assertThat(result.path("isError").asBoolean()).as(text(result)).isTrue();
            assertThat(call(token, "get_document", Map.of("id", root))
                            .path("isError")
                            .asBoolean())
                    .isFalse();
            assertThat(call(token, "get_document", Map.of("id", child))
                            .path("isError")
                            .asBoolean())
                    .isFalse();
        }
        assertThat(text(call(token, "delete_document", Map.of("project", "SAFE", "id", root, "dry_run", false))))
                .contains("expectedVersion");
    }

    @Test
    void documentDeletionKeepsPermissionAndProjectBoundariesAndSubtreeAtomicity() throws Exception {
        String member =
                createToken(cookie(MEMBER), "권한 보호", "NONE").path("secret").asText();
        String admin =
                createToken(cookie(ADMIN), "관리자 삭제", "NONE").path("secret").asText();
        String root = deletionDocument(member, "루트", null);
        String child = deletionDocument(admin, "제한한 하위", root);
        mvc.perform(write(put("/api/v1/workspace/documents/" + child + "/access"))
                        .cookie(cookie(ADMIN))
                        .content("{\"grants\":[{\"subject\":\"OWNER\",\"level\":\"MANAGE\"}]}"))
                .andExpect(status().isNoContent());
        for (boolean dry : java.util.List.of(true, false)) {
            var result = call(
                    member,
                    "delete_document",
                    Map.of("project", "SAFE", "id", root, "expectedVersion", 0, "dry_run", dry));
            assertThat(result.path("isError").asBoolean()).isTrue();
            assertThat(text(result)).contains("AUTH_FORBIDDEN");
        }
        assertThat(call(member, "get_document", Map.of("id", root))
                        .path("isError")
                        .asBoolean())
                .isFalse();
        assertThat(call(admin, "get_document", Map.of("id", child))
                        .path("isError")
                        .asBoolean())
                .isFalse();
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(ADMIN))
                        .content("{\"key\":\"OTHER\",\"name\":\"다른 프로젝트\"}"))
                .andExpect(status().isCreated());
        assertThat(text(call(
                        admin,
                        "delete_document",
                        Map.of("project", "OTHER", "id", root, "expectedVersion", 0, "dry_run", false))))
                .contains("DOCUMENT_NOT_FOUND");
        var result = call(
                admin,
                "delete_document",
                Map.of("project", "SAFE", "id", root, "expectedVersion", 0, "dry_run", false));
        assertThat(result.path("isError").asBoolean()).as(text(result)).isFalse();
        assertThat(call(admin, "get_document", Map.of("id", child))
                        .path("isError")
                        .asBoolean())
                .isTrue();
    }

    @Test
    void archivedProjectsRejectPreviewAndRealDocumentDeletion() throws Exception {
        String token =
                createToken(cookie(ADMIN), "보관한 프로젝트", "NONE").path("secret").asText();
        String id = deletionDocument(token, "보존", null);
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/archive"))
                        .cookie(cookie(ADMIN))
                        .content("{\"expectedVersion\":0}"))
                .andExpect(status().isNoContent());
        for (boolean dry : java.util.List.of(true, false)) {
            var result = call(
                    token,
                    "delete_documents",
                    Map.of(
                            "project",
                            "SAFE",
                            "documents",
                            java.util.List.of(Map.of("id", id, "expectedVersion", 0)),
                            "dry_run",
                            dry));
            assertThat(text(result)).contains("DOCUMENT_PROJECT_ARCHIVED");
        }
        assertThat(call(token, "get_document", Map.of("id", id)).path("isError").asBoolean())
                .isFalse();
    }

    private String deletionDocument(String token, String title, String parent) throws Exception {
        var arguments = new java.util.HashMap<String, Object>();
        arguments.put("project", "SAFE");
        arguments.put("title", title);
        arguments.put("markdown", "본문");
        if (parent != null) arguments.put("parent_id", parent);
        var made = call(token, "create_document", arguments);
        assertThat(made.path("isError").asBoolean()).as(text(made)).isFalse();
        return JSON.readTree(text(made)).path("id").asText();
    }

    private static String location(org.springframework.test.web.servlet.ResultActions result) throws Exception {
        String location = java.util.Objects.requireNonNull(
                result.andExpect(status().isCreated()).andReturn().getResponse().getHeader("Location"));
        return location.substring(location.lastIndexOf('/') + 1);
    }

    private HttpResponse<String> mcp(String token, String method, Map<String, Object> params) throws Exception {
        return mcp(token, method, params, null);
    }

    private HttpResponse<String> mcp(String token, String method, Map<String, Object> params, String pluginVersion)
            throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/mcp"))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json, text/event-stream")
                .POST(HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(
                        Map.of("jsonrpc", "2.0", "id", ++rpc, "method", method, "params", params))));
        if (token != null) request.header("Authorization", "Bearer " + token);
        if (pluginVersion != null) request.header("X-Plugin-Version", pluginVersion);
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private JsonNode call(String token, String tool, Map<String, Object> arguments) throws Exception {
        var response = mcp(token, "tools/call", Map.of("name", tool, "arguments", arguments));
        assertThat(response.statusCode()).as(response.body()).isEqualTo(200);
        return JSON.readTree(response.body()).path("result");
    }

    private static String text(JsonNode result) {
        return result.path("content").get(0).path("text").asText();
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

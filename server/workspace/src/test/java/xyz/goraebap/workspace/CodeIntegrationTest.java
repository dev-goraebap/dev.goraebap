package xyz.goraebap.workspace;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import xyz.goraebap.workspace.support.WorkspaceTestDatabase;
import xyz.goraebap.workspace.project.WorkspaceRoles;
import com.sun.net.httpserver.HttpServer;
import jakarta.servlet.http.Cookie;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
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
 * 저장소 연동 (BIT's Git 연동): a Workspace administrator connects a repository (here without a token, registered by hand),
 * a delivery counts only when signed with the connection's secret, and what it names (SAFE-1 in a branch, a commit or a
 * merge request) is linked to those work items and moves them by the board's defaults or the project's rules.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class CodeIntegrationTest {
    private static final UUID ADMIN = id(1);
    private static final UUID MEMBER = id(2);
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    SessionService sessions;

    @BeforeEach
    void prepare() throws Exception {
        TestDatabase.clear(jdbc);
        WorkspaceTestDatabase.seed(jdbc);
        member(ADMIN, "가관리", "admin@example.test", WorkspaceRoles.ADMIN);
        member(MEMBER, "나구성원", "member@example.test");
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(ADMIN))
                        .content("{\"key\":\"SAFE\",\"name\":\"안전플랫폼\"}"))
                .andExpect(status().isCreated());
        ProjectMembers.editors(jdbc, "SAFE", MEMBER);
        for (String title : new String[] {"로그인", "화면", "배포"})
            mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues"))
                            .cookie(cookie(MEMBER))
                            .content("{\"title\":\"" + title + "\"}"))
                    .andExpect(status().isCreated());
    }

    @Test
    void connectionWithoutATokenReturnsTheStoredVersion() throws Exception {
        var created = connect(gitlab());
        var listed = JSON.readTree(
                mvc.perform(get("/api/v1/workspace/projects/SAFE/integrations").cookie(cookie(ADMIN)))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString());
        assertThat(created.path("version").asLong())
                .isEqualTo(listed.get(0).path("version").asLong());
    }

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void connectionResponseCanImmediatelyBeUsedToRotateItsToken(boolean registersWebhook) throws Exception {
        var host = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        host.createContext("/api/v4/", exchange -> {
            String path = exchange.getRequestURI().getPath();
            int statusCode = path.endsWith("/hooks") ? (registersWebhook ? 201 : 403) : 200;
            String body = path.endsWith("/hooks")
                    ? "{\"id\":55}"
                    : path.endsWith("/user")
                            ? "{\"username\":\"test\"}"
                            : "{\"id\":42,\"path_with_namespace\":\"team/safe\",\"web_url\":\"https://example.test/team/safe\"}";
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(statusCode, bytes.length);
            try (var output = exchange.getResponseBody()) {
                output.write(bytes);
            }
        });
        host.start();
        try {
            var created = connect("{\"provider\":\"gitlab\",\"baseUrl\":\"http://127.0.0.1:"
                    + host.getAddress().getPort()
                    + "\",\"repository\":\"team/safe\",\"token\":\"initial-test-token\"}");
            assertThat(created.path("webhookRegistered").asBoolean()).isEqualTo(registersWebhook);
            var listed = JSON.readTree(mvc.perform(
                            get("/api/v1/workspace/projects/SAFE/integrations").cookie(cookie(ADMIN)))
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString());
            long version = created.path("version").asLong();
            assertThat(version).isEqualTo(listed.get(0).path("version").asLong());
            String path = "/api/v1/workspace/projects/SAFE/integrations/"
                    + created.path("id").asText();
            String edit = "{\"expectedVersion\":" + version + ",\"token\":\"rotated-test-token\"}";
            mvc.perform(write(patch(path)).cookie(cookie(ADMIN)).content(edit))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.version").value(version + 1));
            mvc.perform(write(patch(path)).cookie(cookie(ADMIN)).content(edit))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("INTEGRATION_VERSION_CONFLICT"));
        } finally {
            host.stop(0);
        }
    }

    @Test
    void onlyAProjectsAdministratorConnectsAndOnlyThemSeeTheSecret() throws Exception {
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/integrations"))
                        .cookie(cookie(MEMBER))
                        .content(gitlab()))
                .andExpect(status().isForbidden());
        var connected = connect(gitlab());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/integrations").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].repository").value("team/safe"))
                .andExpect(jsonPath("$[0].webUrl").value("https://gitlab.example.test/team/safe"))
                .andExpect(jsonPath("$[0].hasToken").value(false))
                .andExpect(jsonPath("$[0].webhookSecret").value(""))
                .andExpect(jsonPath("$[0].webhookUrl")
                        .value(endsWith("/api/v1/hooks/" + connected.path("id").asText())));
        // The same repository cannot be connected twice.
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/integrations"))
                        .cookie(cookie(ADMIN))
                        .content(gitlab()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INTEGRATION_EXISTS"));
        // The secret is sealed, never kept in the clear.
        String sealed = jdbc.queryForObject("SELECT webhook_secret_cipher FROM repository_integration", String.class);
        org.assertj.core.api.Assertions.assertThat(sealed)
                .startsWith("v1:")
                .doesNotContain(connected.path("webhookSecret").asText());
    }

    @ParameterizedTest
    @ValueSource(strings = {"gitlab", "github", "gitea"})
    void aProjectConnectsSeveralRepositoriesOnTheSameHost(String provider) throws Exception {
        var frontend = connect(repository(provider, "https://git.example.test", "team/frontend"));
        var backend = connect(repository(provider, "https://git.example.test", "team/backend"));
        assertThat(frontend.path("id").asText()).isNotEqualTo(backend.path("id").asText());
        assertThat(frontend.path("webhookSecret").asText())
                .isNotEqualTo(backend.path("webhookSecret").asText());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/integrations").cookie(cookie(ADMIN)))
                .andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/integrations"))
                        .cookie(cookie(ADMIN))
                        .content(repository(
                                provider, "https://git.example.test/", "https://git.example.test/team/frontend.git/")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INTEGRATION_EXISTS"));
        connect(repository(provider, "https://other.example.test", "team/frontend"));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/integrations").cookie(cookie(ADMIN)))
                .andExpect(jsonPath("$", hasSize(3)));
    }

    @Test
    void repositoriesKeepSameNamedBranchesCommitsAndMergeRequestsSeparate() throws Exception {
        var frontend = connect(repository("gitlab", "https://git.example.test", "team/frontend"));
        var backend = connect(repository("gitlab", "https://git.example.test", "team/backend"));
        String push = """
                {"ref":"refs/heads/feature/SAFE-1","after":"same-sha","user_name":"dev",
                 "project":{"web_url":"https://git.example.test/team/safe"},
                 "commits":[{"id":"same-sha","message":"SAFE-1 change","url":"https://git.example.test/commit/same-sha","author":{"name":"dev"}}]}
                """;
        for (var integration : new JsonNode[] {frontend, backend}) hook(integration, "Push Hook", push);
        mvc.perform(post("/api/v1/hooks/" + backend.path("id").asText())
                        .header("X-Gitlab-Event", "Push Hook")
                        .header("X-Gitlab-Token", frontend.path("webhookSecret").asText())
                        .contentType("application/json")
                        .content(push))
                .andExpect(status().isNotFound());
        String mergeRequest = """
                {"user":{"username":"dev"},"object_attributes":{"iid":1,"title":"SAFE-1 change",
                 "source_branch":"feature/SAFE-1","action":"open","url":"https://git.example.test/mr/1"}}
                """;
        for (var integration : new JsonNode[] {frontend, backend})
            hook(integration, "Merge Request Hook", mergeRequest);
        var links = JSON.readTree(mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1/code-links")
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(6)))
                .andReturn()
                .getResponse()
                .getContentAsString());
        for (var integration : new JsonNode[] {frontend, backend}) {
            int count = 0;
            for (var link : links)
                if (link.path("integrationId")
                        .asText()
                        .equals(integration.path("id").asText())) {
                    assertThat(link.path("repository").asText())
                            .isEqualTo(integration.path("repository").asText());
                    assertThat(link.path("baseUrl").asText()).isEqualTo("https://git.example.test");
                    count++;
                }
            assertThat(count).isEqualTo(3);
        }
        mvc.perform(write(delete("/api/v1/workspace/projects/SAFE/integrations/"
                                + frontend.path("id").asText()))
                        .cookie(cookie(ADMIN)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1/code-links").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath(
                        "$[*].repository", containsInAnyOrder("team/backend", "team/backend", "team/backend")));
        hook(backend, "Push Hook", push);
    }

    private void hook(JsonNode integration, String event, String body) throws Exception {
        mvc.perform(post("/api/v1/hooks/" + integration.path("id").asText())
                        .header("X-Gitlab-Event", event)
                        .header(
                                "X-Gitlab-Token",
                                integration.path("webhookSecret").asText())
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isAccepted());
    }

    @Test
    void rotatingOneRepositoryTokenLeavesTheOtherConnectionUnchanged() throws Exception {
        var host = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        host.createContext("/api/v4/", exchange -> {
            String path = exchange.getRequestURI().getRawPath();
            boolean front = path.contains("frontend");
            String body = path.endsWith("/user")
                    ? "{\"username\":\"test\"}"
                    : "{\"id\":" + (front ? 42 : 43) + ",\"path_with_namespace\":\"team/"
                            + (front ? "frontend" : "backend") + "\"}";
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(path.endsWith("/hooks") ? 403 : 200, bytes.length);
            try (var output = exchange.getResponseBody()) {
                output.write(bytes);
            }
        });
        host.start();
        try {
            String base = "http://127.0.0.1:" + host.getAddress().getPort();
            var frontend = connect(
                    repository("gitlab", base, "team/frontend").replace("}", ",\"token\":\"front-test-token\"}"));
            var backend =
                    connect(repository("gitlab", base, "team/backend").replace("}", ",\"token\":\"back-test-token\"}"));
            String before = jdbc.queryForObject(
                    "SELECT token_cipher FROM repository_integration WHERE integration_id=?",
                    String.class,
                    backend.path("id").asText());
            mvc.perform(write(patch("/api/v1/workspace/projects/SAFE/integrations/"
                                    + frontend.path("id").asText()))
                            .cookie(cookie(ADMIN))
                            .content("{\"expectedVersion\":"
                                    + frontend.path("version").asLong() + ",\"token\":\"rotated-front-test-token\"}"))
                    .andExpect(status().isOk());
            var rows = JSON.readTree(mvc.perform(
                            get("/api/v1/workspace/projects/SAFE/integrations").cookie(cookie(ADMIN)))
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString());
            for (var row : rows)
                if (row.path("id").asText().equals(backend.path("id").asText())) {
                    assertThat(row.path("version").asLong())
                            .isEqualTo(backend.path("version").asLong());
                    assertThat(row.path("webhookSecret").asText())
                            .isEqualTo(backend.path("webhookSecret").asText());
                }
            assertThat(jdbc.queryForObject(
                            "SELECT token_cipher FROM repository_integration WHERE integration_id=?",
                            String.class,
                            backend.path("id").asText()))
                    .isEqualTo(before);
        } finally {
            host.stop(0);
        }
    }

    private static String repository(String provider, String base, String name) {
        return "{\"provider\":\"" + provider + "\",\"baseUrl\":\"" + base + "\",\"repository\":\"" + name + "\"}";
    }

    @Test
    void aGitLabDeliveryLinksAndMovesWhatItNames() throws Exception {
        var connected = connect(gitlab());
        String hook = "/api/v1/hooks/" + connected.path("id").asText();
        String secret = connected.path("webhookSecret").asText();
        String push = "{\"ref\":\"refs/heads/feature/safe-1-login\",\"after\":\"abc1234def\",\"user_username\":\"dev\","
                + "\"project\":{\"web_url\":\"https://gitlab.example.test/team/safe\"},\"commits\":["
                + "{\"id\":\"abc1234def\",\"message\":\"SAFE-2 화면도 고침\\n\\n본문\",\"url\":\"https://gitlab.example.test/c/abc\","
                + "\"author\":{\"name\":\"개발\"}}]}";

        // A wrong or missing secret is refused, all alike; nothing is linked.
        mvc.perform(post(hook)
                        .header("X-Gitlab-Event", "Push Hook")
                        .header("X-Gitlab-Token", "wrong")
                        .contentType("application/json")
                        .content(push))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/hooks/" + UUID.randomUUID())
                        .header("X-Gitlab-Token", secret)
                        .contentType("application/json")
                        .content(push))
                .andExpect(status().isNotFound());

        mvc.perform(post(hook)
                        .header("X-Gitlab-Event", "Push Hook")
                        .header("X-Gitlab-Token", secret)
                        .contentType("application/json")
                        .content(push))
                .andExpect(status().isAccepted());
        // The branch names SAFE-1: linked with its commit, and it starts (the first column under way).
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1/code-links").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[*].kind").value(containsInAnyOrder("branch", "commit")))
                .andExpect(jsonPath("$[?(@.kind == 'commit')].title").value(containsInAnyOrder("SAFE-2 화면도 고침")));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.columnName").value("진행 중"));
        // The commit names SAFE-2: linked, not moved.
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/2/code-links").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[*].kind").value(containsInAnyOrder("commit")));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/2").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.columnName").value("할 일"));

        // A merged merge request naming SAFE-1 finishes it; its link shows it merged.
        String merged = "{\"user\":{\"username\":\"dev\"},\"object_attributes\":{\"action\":\"merge\",\"iid\":7,"
                + "\"title\":\"SAFE-1 로그인 고침\",\"description\":\"\",\"url\":\"https://gitlab.example.test/mr/7\","
                + "\"source_branch\":\"feature/safe-1-login\"}}";
        mvc.perform(post(hook)
                        .header("X-Gitlab-Event", "Merge Request Hook")
                        .header("X-Gitlab-Token", secret)
                        .contentType("application/json")
                        .content(merged))
                .andExpect(status().isAccepted());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1/code-links").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[?(@.kind == 'pull_request')].state").value(containsInAnyOrder("merged")));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.columnName").value("완료"));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.items[?(@.number == 1)].pullRequests.merged")
                        .value(containsInAnyOrder(1)))
                .andExpect(jsonPath("$.items[?(@.number == 2)].pullRequests.merged")
                        .value(containsInAnyOrder(0)));

        // A rule without a column keeps a pushed branch's work item where it is.
        mvc.perform(write(put("/api/v1/workspace/projects/SAFE/integration-rules"))
                        .cookie(cookie(ADMIN))
                        .content("{\"items\":[{\"event\":\"branch_push\",\"set\":true,\"columnId\":null}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.event == 'branch_push')].set").value(containsInAnyOrder(true)));
        mvc.perform(post(hook)
                        .header("X-Gitlab-Event", "Push Hook")
                        .header("X-Gitlab-Token", secret)
                        .contentType("application/json")
                        .content("{\"ref\":\"refs/heads/SAFE-3\",\"after\":\"fff\",\"commits\":[]}"))
                .andExpect(status().isAccepted());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/3").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.columnName").value("할 일"));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/3/code-links").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[*].kind").value(containsInAnyOrder("branch")));

        // Disconnecting takes the links with it.
        mvc.perform(write(delete("/api/v1/workspace/projects/SAFE/integrations/"
                                + connected.path("id").asText()))
                        .cookie(cookie(ADMIN)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1/code-links").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void aGitHubDeliveryCountsOnlyWithItsSignature() throws Exception {
        var connected = connect("{\"provider\":\"github\",\"repository\":\"https://github.com/team/safe.git\"}");
        org.assertj.core.api.Assertions.assertThat(connected.path("repository").asText())
                .isEqualTo("team/safe");
        String hook = "/api/v1/hooks/" + connected.path("id").asText();
        String body =
                "{\"ref\":\"refs/heads/main\",\"after\":\"a1\",\"repository\":{\"html_url\":\"https://github.com/team/safe\"},"
                        + "\"sender\":{\"login\":\"dev\"},\"commits\":[{\"id\":\"a1\",\"message\":\"Fix SAFE-2\",\"url\":\"u\","
                        + "\"author\":{\"name\":\"개발\"}}]}";
        mvc.perform(post(hook)
                        .header("X-GitHub-Event", "push")
                        .header("X-Hub-Signature-256", "sha256=00")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isNotFound());
        mvc.perform(post(hook)
                        .header("X-GitHub-Event", "push")
                        .header(
                                "X-Hub-Signature-256",
                                "sha256="
                                        + hmac(
                                                body,
                                                connected.path("webhookSecret").asText()))
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isAccepted());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/2/code-links").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[0].kind").value("commit"))
                .andExpect(jsonPath("$[0].provider").value("github"));
    }

    private JsonNode connect(String content) throws Exception {
        return JSON.readTree(mvc.perform(write(post("/api/v1/workspace/projects/SAFE/integrations"))
                        .cookie(cookie(ADMIN))
                        .content(content))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8));
    }

    private static String gitlab() {
        return "{\"provider\":\"gitlab\",\"baseUrl\":\"https://gitlab.example.test/\",\"repository\":\"team/safe\"}";
    }

    private static String hmac(String body, String secret) throws Exception {
        var mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
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

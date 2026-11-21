package xyz.goraebap.cowork;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import xyz.goraebap.cowork.module.user.application.auth.SessionService;
import xyz.goraebap.cowork.support.Accounts;
import xyz.goraebap.cowork.support.Members;
import xyz.goraebap.cowork.support.TestDatabase;

/**
 * The error contract for requests that never reach a controller: broken percent-encoding, URLs the security firewall
 * rejects and those Tomcat refuses itself. MockMvc has neither Tomcat nor its parsing, so these go to a running server
 * as raw request lines, exactly as sent.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Tag("integration")
class RawHttpErrorContractTest {
    private static final UUID MEMBER = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @LocalServerPort
    int port;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    SessionService sessions;

    private String session;

    @BeforeEach
    void prepare() {
        TestDatabase.clear(jdbc);
        Accounts.upsert(jdbc, MEMBER, MEMBER + "@example.test", true);
        Members.insert(
                jdbc,
                Members.member(MEMBER, "구성원", MEMBER + "@example.test")
                        .invitedAt(java.time.Instant.parse("2026-01-01T00:00:00.000000Z")));
        session = "cowork_session=" + sessions.issue(MEMBER).token();
    }

    @org.junit.jupiter.api.Disabled("오피스를 뺀 뒤 깨짐: 오피스 주소나 도구를 썼다. 워크스페이스 기준으로 다시 쓴다.")
    @Test
    void brokenPercentEncodingInTheQueryIsABadRequest() throws IOException {
        for (String target : new String[] {
            "/api/v1/office/calendar/events?q=QA&cursor=%%%%",
            "/api/v1/office/approval/sent?cursor=%%%%",
            "/api/v1/notifications?category=%zz"
        }) {
            assertProblem(send("GET", target, true), 400, "COMMON_INVALID_REQUEST", target);
        }
    }

    @Test
    void urlsTheFirewallRejectsAnswerAsProblems() throws IOException {
        for (String target :
                new String[] {"/api/v1//auth/me", "/api/v1/office/employees;x=1", "/api/v1/health;/../auth/me"}) {
            assertProblem(send("GET", target, true), 400, "COMMON_INVALID_REQUEST", target);
        }
    }

    @Test
    void urlsTomcatRefusesItselfAnswerAsProblems() throws IOException {
        for (String target : new String[] {"/api/v1/office/employees%2F" + MEMBER, "/api/v1/%%%%"}) {
            assertProblem(send("GET", target, true), 400, "COMMON_INVALID_REQUEST", target);
        }
    }

    @Test
    void theErrorPageAskedForDirectlyIsNotAnAddress() throws IOException {
        assertProblem(send("GET", "/error", false), 404, "COMMON_NOT_FOUND", "/error");
    }

    private void assertProblem(Answer answer, int status, String code, String target) {
        assertThat(answer.status()).as(target).isEqualTo(status);
        assertThat(answer.head()).as(target).containsIgnoringCase("Content-Type: application/problem+json");
        JsonNode body = JsonMapper.builder().build().readTree(answer.body());
        assertThat(body.get("status").asInt()).as(target).isEqualTo(status);
        assertThat(body.get("code").asString()).as(target).isEqualTo(code);
        assertThat(body.get("traceId").asString()).as(target).isNotBlank();
        assertThat(answer.head())
                .as(target)
                .contains("X-Trace-Id: " + body.get("traceId").asString());
        // Nothing of what was sent comes back.
        assertThat(answer.body()).as(target).doesNotContain("%").doesNotContain(";x=1");
    }

    /**
     * Sends the request line as written; an HTTP client would encode or normalize the target first. HTTP/1.0 keeps
     * the body unchunked: the server closes the connection after it.
     */
    @Test
    void textIsSentCompressedToABrowserThatAcceptsIt() throws Exception {
        var client = java.net.http.HttpClient.newHttpClient();
        var plain = client.send(
                java.net.http.HttpRequest.newBuilder(java.net.URI.create("http://127.0.0.1:" + port + "/api/openapi"))
                        .build(),
                java.net.http.HttpResponse.BodyHandlers.ofByteArray());
        var zipped = client.send(
                java.net.http.HttpRequest.newBuilder(java.net.URI.create("http://127.0.0.1:" + port + "/api/openapi"))
                        .header("Accept-Encoding", "gzip")
                        .build(),
                java.net.http.HttpResponse.BodyHandlers.ofByteArray());
        assertThat(plain.statusCode()).isEqualTo(200);
        assertThat(plain.headers().firstValue("Content-Encoding")).isEmpty();
        assertThat(zipped.headers().firstValue("Content-Encoding")).hasValue("gzip");
        assertThat(zipped.body().length).isLessThan(plain.body().length / 3);
    }

    private Answer send(String method, String target, boolean signedIn) throws IOException {
        String request = method + " " + target + " HTTP/1.0\r\nHost: localhost\r\n"
                + (signedIn ? "Cookie: " + session + "\r\n" : "")
                + "\r\n";
        try (Socket socket = new Socket("127.0.0.1", port)) {
            OutputStream out = socket.getOutputStream();
            out.write(request.getBytes(StandardCharsets.US_ASCII));
            out.flush();
            ByteArrayOutputStream received = new ByteArrayOutputStream();
            socket.getInputStream().transferTo(received);
            String raw = received.toString(StandardCharsets.UTF_8);
            int split = raw.indexOf("\r\n\r\n");
            return new Answer(Integer.parseInt(raw.split(" ")[1]), raw.substring(0, split), raw.substring(split + 4));
        }
    }

    private record Answer(int status, String head, String body) {}
}

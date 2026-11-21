package xyz.goraebap.cowork;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.sql.DriverManager;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.json.JsonMapper;
import xyz.goraebap.cowork.module.system.infrastructure.LogDatabase;
import xyz.goraebap.cowork.module.system.infrastructure.LogMaintenance;
import xyz.goraebap.cowork.module.system.infrastructure.LogWriter;
import xyz.goraebap.cowork.module.user.application.auth.SessionService;
import xyz.goraebap.cowork.shared.storage.ObjectStorage;
import xyz.goraebap.cowork.support.Accounts;
import xyz.goraebap.cowork.support.Members;
import xyz.goraebap.cowork.support.TestDatabase;

/**
 * The system status page end to end: what a request leaves (a change or a marked read as an activity with its member
 * and address but never its body or query, every request as a count), server errors taken from the logger and merged
 * per minute, the 30-day trim and the weekly copy, and administrators alone reading it.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class SystemStatusTest {
    private static final UUID ADMIN = id(1);
    private static final UUID MEMBER = id(2);

    private final JsonMapper json = JsonMapper.builder().build();

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    SessionService sessions;

    @Autowired
    LogWriter logWriter;

    @Autowired
    LogMaintenance logMaintenance;

    @Autowired
    LogDatabase logDatabase;

    @Autowired
    ObjectStorage storage;

    @BeforeEach
    void prepare() throws Exception {
        TestDatabase.clear(jdbc);
        employee(ADMIN, "관리자", true);
        employee(MEMBER, "구성원", false);
        logWriter.flush();
        try (var connection = DriverManager.getConnection("jdbc:sqlite:" + logDatabase.file());
                var statement = connection.createStatement()) {
            for (String table : new String[] {"activity", "request_hour", "server_error", "log_backup", "screen_visit"})
                statement.execute("DELETE FROM " + table);
        }
    }

    @org.junit.jupiter.api.Disabled("오피스를 뺀 뒤 깨짐: 오피스 주소나 도구를 썼다. 워크스페이스 기준으로 다시 쓴다.")
    @Test
    void aChangeAndAMarkedReadAreRecordedButPlainReadsAreOnlyCounted() throws Exception {
        Cookie member = cookie(MEMBER);
        Cookie admin = cookie(ADMIN);
        // A change, refused here (no push on a test server), with a body that must not be kept.
        mvc.perform(write(post("/api/v1/push/tests"))
                        .cookie(member)
                        .header("X-Real-IP", "203.0.113.7")
                        .header("User-Agent", "Mozilla/5.0 (Macintosh) Chrome/154")
                        .content("{\"subscriptionId\":\"" + UUID.randomUUID() + "\"}"))
                .andExpect(status().is4xxClientError());
        // A plain read, with a query that must not be kept either.
        mvc.perform(get("/api/v1/push/devices?secret=주민번호").cookie(member)).andExpect(status().isOk());
        // A read marked as worth keeping: an administrator opening a member's record.
        mvc.perform(get("/api/v1/office/employees/" + MEMBER).cookie(admin)).andExpect(status().isOk());
        logWriter.flush();

        mvc.perform(get("/api/v1/system/activities").cookie(admin))
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].route").value("/api/v1/office/employees/{id}"))
                .andExpect(jsonPath("$.items[0].target").value("id=" + MEMBER))
                .andExpect(jsonPath("$.items[0].employeeName").value("관리자"))
                .andExpect(jsonPath("$.items[1].method").value("POST"))
                .andExpect(jsonPath("$.items[1].route").value("/api/v1/push/tests"))
                .andExpect(jsonPath("$.items[1].employeeName").value("구성원"))
                .andExpect(jsonPath("$.items[1].ip").value("203.0.113.7"))
                .andExpect(jsonPath("$.items[1].userAgent").value("Mozilla/5.0 (Macintosh) Chrome/154"))
                .andExpect(jsonPath("$.items[*].route", not(hasItem("/api/v1/push/devices"))));
        mvc.perform(get("/api/v1/system/activities?outcome=REFUSED&employeeId=" + MEMBER)
                        .cookie(admin))
                .andExpect(jsonPath("$.items", hasSize(1)));
        mvc.perform(get("/api/v1/system/activities?q=employees").cookie(admin))
                .andExpect(jsonPath("$.items", hasSize(1)));
        try (var connection = DriverManager.getConnection("jdbc:sqlite:" + logDatabase.file());
                var statement = connection.createStatement();
                var rows = statement.executeQuery(
                        "SELECT group_concat(route || coalesce(target, ''), ' ') FROM activity")) {
            rows.next();
            assertThat(rows.getString(1)).doesNotContain("subscriptionId").doesNotContain("주민번호");
        }

        // Every request is counted, the plain read too, by the hour it came in.
        mvc.perform(get("/api/v1/system/traffic?range=DAY").cookie(admin))
                .andExpect(jsonPath("$.buckets", hasSize(24)))
                .andExpect(jsonPath("$.totals.requests").value(org.hamcrest.Matchers.greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.totals.activeMembers").value(2))
                .andExpect(jsonPath("$.busiest[*].route", hasItem("/api/v1/push/devices")));
        mvc.perform(get("/api/v1/system/traffic?range=MONTH").cookie(admin))
                .andExpect(jsonPath("$.buckets", hasSize(30)));
    }

    @Test
    void serverErrorsComeFromTheLoggerWithTheirRequestAndABurstIsOneLine() throws Exception {
        var logger = LoggerFactory.getLogger("xyz.goraebap.cowork.module.example.Job");
        MDC.put("traceId", "trace-1");
        try {
            logger.error("주문 123 처리 실패", new IllegalStateException("깨짐"));
            logger.error("주문 456 처리 실패", new IllegalStateException("깨짐"));
            logger.warn("우리 코드의 경고");
            LoggerFactory.getLogger("org.example.Library").warn("라이브러리의 경고");
        } finally {
            MDC.remove("traceId");
        }
        logWriter.flush();

        Cookie admin = cookie(ADMIN);
        String body = mvc.perform(get("/api/v1/system/errors").cookie(admin))
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[*].message", hasItem("우리 코드의 경고")))
                .andExpect(jsonPath("$.items[*].message", not(hasItem("라이브러리의 경고"))))
                .andReturn()
                .getResponse()
                .getContentAsString();
        var burst = json.readTree(body)
                .get("items")
                .valueStream()
                .filter(item -> item.get("level").asString().equals("ERROR"))
                .findFirst()
                .orElseThrow();
        assertThat(burst.get("occurrences").asInt()).isEqualTo(2);
        assertThat(burst.get("traceId").asString()).isEqualTo("trace-1");
        mvc.perform(get("/api/v1/system/errors/" + burst.get("id").asLong()).cookie(admin))
                .andExpect(jsonPath("$.stack", containsString("IllegalStateException: 깨짐")));
        mvc.perform(get("/api/v1/system/errors?level=WARN").cookie(admin)).andExpect(jsonPath("$.items", hasSize(1)));
        mvc.perform(get("/api/v1/system/errors/999999").cookie(admin))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SYSTEM_ERROR_NOT_FOUND"));
    }

    @Test
    void recordsOlderThanThirtyDaysGoAndTheWeeklyCopyLandsInStorage() throws Exception {
        var old = Instant.now().minus(31, ChronoUnit.DAYS).truncatedTo(ChronoUnit.MICROS);
        try (var connection = DriverManager.getConnection("jdbc:sqlite:" + logDatabase.file());
                var statement = connection.prepareStatement(
                        "INSERT INTO activity(at,ip,method,route,status,duration_ms,trace_id)"
                                + " VALUES (?,'127.0.0.1','PUT','/api/v1/old',204,3,'t')")) {
            statement.setString(1, old.toString());
            statement.execute();
        }
        mvc.perform(write(post("/api/v1/push/tests")).cookie(cookie(MEMBER)).content("{}"));
        logWriter.flush();

        logMaintenance.forget();
        logMaintenance.backUp();

        Cookie admin = cookie(ADMIN);
        mvc.perform(get("/api/v1/system/activities?from=" + LocalDate.now().minusDays(40))
                        .cookie(admin))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].route").value("/api/v1/push/tests"));
        String key = "log-backups/" + LocalDate.now(ZoneId.of("Asia/Seoul")) + ".db";
        mvc.perform(get("/api/v1/system/status").cookie(admin))
                .andExpect(jsonPath("$.logStore.ok").value(true))
                .andExpect(jsonPath("$.lastBackup.objectKey").value(key))
                .andExpect(jsonPath("$.lastBackup.error").doesNotExist());
        assertThat(storage.find(key))
                .hasValueSatisfying(copy -> assertThat(copy.size()).isPositive());
    }

    @Test
    void aScreenOpenedAgainWithinThirtyMinutesOfTheLastTimeIsOneLineAndLaterStartsAnother() throws Exception {
        Cookie member = cookie(MEMBER);
        visit(member, "/meetings");
        visit(member, "/meetings");
        visit(member, "/calendar");
        logWriter.flush();

        Cookie admin = cookie(ADMIN);
        mvc.perform(get("/api/v1/system/activities?kind=VISIT&q=/meetings").cookie(admin))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].kind").value("VISIT"))
                .andExpect(jsonPath("$.items[0].route").value("/meetings"))
                .andExpect(jsonPath("$.items[0].visits").value(2))
                .andExpect(jsonPath("$.items[0].employeeName").value("구성원"))
                .andExpect(jsonPath("$.items[0].ip").value("127.0.0.1"));
        // Visits sit in the activity record with the changes, but a visit report is not a change besides.
        mvc.perform(get("/api/v1/system/activities?employeeId=" + MEMBER).cookie(admin))
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].route").value("/calendar"));
        mvc.perform(get("/api/v1/system/activities?kind=CHANGE").cookie(admin))
                .andExpect(jsonPath("$.items", hasSize(0)));
        // An outcome is a change's alone, so asking for one leaves the visits out.
        mvc.perform(get("/api/v1/system/activities?outcome=SUCCESS").cookie(admin))
                .andExpect(jsonPath("$.items", hasSize(0)));

        // The last visit 31 minutes ago: opening the screen again starts a line of its own.
        try (var connection = DriverManager.getConnection("jdbc:sqlite:" + logDatabase.file());
                var statement =
                        connection.prepareStatement("UPDATE screen_visit SET last_at = ? WHERE screen = '/meetings'")) {
            statement.setString(
                    1,
                    Instant.now()
                            .minus(31, ChronoUnit.MINUTES)
                            .truncatedTo(ChronoUnit.MICROS)
                            .toString());
            statement.execute();
        }
        visit(member, "/meetings");
        logWriter.flush();
        mvc.perform(get("/api/v1/system/activities?kind=VISIT&q=/meetings").cookie(admin))
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].visits").value(1));

        mvc.perform(write(post("/api/v1/system/visits")).cookie(member).content("{\"screen\":\"https://elsewhere\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void changesAndVisitsAtTheSameMomentPageThroughWithoutLossOrRepeat() throws Exception {
        // A fraction with no trailing zeros: Instant.toString drops them (.123Z), unlike the six digits the server
        // writes and binds, and the cursor would then not match the rows it stands for.
        String moment = Instant.now()
                .minus(1, ChronoUnit.HOURS)
                .truncatedTo(ChronoUnit.SECONDS)
                .plusNanos(123_456_000)
                .toString();
        try (var connection = DriverManager.getConnection("jdbc:sqlite:" + logDatabase.file());
                var change = connection.prepareStatement("INSERT INTO activity(at,employee_id,ip,method,route,status,"
                        + "duration_ms,trace_id) VALUES (?,?,'127.0.0.1','PUT','/api/v1/x',204,3,'t')");
                var visit =
                        connection.prepareStatement("INSERT INTO screen_visit(employee_id,screen,ip,first_at,last_at,"
                                + "visits) VALUES (?,'/meetings','127.0.0.1',?,?,1)")) {
            for (int i = 0; i < 30; i++) {
                change.setString(1, moment);
                change.setString(2, MEMBER.toString());
                change.execute();
                visit.setString(1, MEMBER.toString());
                visit.setString(2, moment);
                visit.setString(3, moment);
                visit.execute();
            }
        }
        Cookie admin = cookie(ADMIN);
        var first = json.readTree(mvc.perform(get("/api/v1/system/activities").cookie(admin))
                .andReturn()
                .getResponse()
                .getContentAsString());
        assertThat(first.get("items").size()).isEqualTo(50);
        assertThat(first.get("items").get(29).get("kind").asString()).isEqualTo("CHANGE");
        assertThat(first.get("items").get(30).get("kind").asString()).isEqualTo("VISIT");
        var second = json.readTree(mvc.perform(get("/api/v1/system/activities?cursor="
                                + first.get("nextCursor").asString())
                        .cookie(admin))
                .andReturn()
                .getResponse()
                .getContentAsString());
        assertThat(second.get("items").size()).isEqualTo(10);
        assertThat(second.get("nextCursor").isNull()).isTrue();
        var seen = new java.util.HashSet<String>();
        for (var page : new tools.jackson.databind.JsonNode[] {first, second})
            page.get("items")
                    .forEach(item -> seen.add(
                            item.get("kind").asString() + item.get("id").asLong()));
        assertThat(seen).hasSize(60);
    }

    @Test
    void onlyAdministratorsReadIt() throws Exception {
        Cookie member = cookie(MEMBER);
        for (String path : new String[] {"/status", "/traffic", "/activities", "/errors"})
            mvc.perform(get("/api/v1/system" + path).cookie(member)).andExpect(status().isForbidden());
    }

    private void employee(UUID id, String name, boolean admin) {
        Accounts.upsert(jdbc, id, id + "@example.test", true, Accounts.when(admin, Accounts.all()));
        Members.insert(jdbc, Members.member(id, name, id + "@example.test"));
    }

    private void visit(Cookie member, String screen) throws Exception {
        mvc.perform(write(post("/api/v1/system/visits")).cookie(member).content("{\"screen\":\"" + screen + "\"}"))
                .andExpect(status().isNoContent());
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
        var tree = json.readTree(result.getResponse().getContentAsString());
        return builder.cookie(result.getResponse().getCookies())
                .header(tree.get("headerName").asString(), tree.get("token").asString())
                .header("Origin", "http://localhost:4402")
                .contentType("application/json");
    }
}

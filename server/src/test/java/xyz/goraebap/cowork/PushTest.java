package xyz.goraebap.cowork;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.security.KeyPairGenerator;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.function.Supplier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;
import xyz.goraebap.cowork.module.notification.Notice;
import xyz.goraebap.cowork.module.notification.NotificationFacade;
import xyz.goraebap.cowork.module.notification.Subject;
import xyz.goraebap.cowork.module.notification.application.PushGateway;
import xyz.goraebap.cowork.module.user.application.auth.SessionService;
import xyz.goraebap.cowork.shared.web.Role;
import xyz.goraebap.cowork.support.Accounts;
import xyz.goraebap.cowork.support.Members;
import xyz.goraebap.cowork.support.TestDatabase;

/**
 * Browser push end to end but for the push service itself, which the gateway stands in for: devices subscribe and end,
 * groups turn off, a notice queues a push a device (or a record of why none went) that goes after commit, a device the
 * push service calls gone ends, and administrators read it all.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class PushTest {
    private static final UUID ADMIN = id(1);
    private static final UUID MEMBER = id(2);
    private static final UUID OTHER = id(3);
    private static final Instant NOW = Instant.parse("2026-09-30T01:00:00Z");

    private final JsonMapper json = JsonMapper.builder().build();

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    SessionService sessions;

    @Autowired
    NotificationFacade notifications;

    @Autowired
    TransactionTemplate transactions;

    @MockitoBean
    Clock clock;

    @MockitoBean
    PushGateway pushGateway;

    @BeforeEach
    void prepare() {
        when(clock.instant()).thenReturn(NOW);
        when(clock.getZone()).thenReturn(ZoneId.of("Asia/Seoul"));
        when(pushGateway.isConfigured()).thenReturn(true);
        when(pushGateway.publicKey()).thenReturn("BPublicKeyForTests");
        when(pushGateway.send(any(), any())).thenReturn(new PushGateway.PushAnswer(201, null, false));
        TestDatabase.clear(jdbc);
        employee(ADMIN, "관리자", true);
        employee(MEMBER, "구성원", false);
        employee(OTHER, "다른 사람", false);
    }

    @Test
    void aDeviceSubscribesTakesPushesAndEnds() throws Exception {
        Cookie member = cookie(MEMBER);
        mvc.perform(get("/api/v1/push/config").cookie(member))
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.publicKey").value("BPublicKeyForTests"));
        String laptop = subscribe(member, "https://push.example.test/laptop", "Chrome · Windows");
        subscribe(member, "https://push.example.test/phone", "Safari · iPhone");
        mvc.perform(get("/api/v1/push/devices").cookie(member)).andExpect(jsonPath("$", hasSize(2)));

        // The test push goes after commit; how it went shows on the device.
        mvc.perform(write(post("/api/v1/push/tests")).cookie(member).content("{\"subscriptionId\":\"" + laptop + "\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.devices").value(1));
        awaitCount("SELECT count(*) FROM push_delivery WHERE status='SENT'", 1);
        // A test is marked, so the device shows it even while the app is on screen.
        verify(pushGateway).send(any(), argThat(PushGateway.PushMessage::test));
        mvc.perform(get("/api/v1/push/devices").cookie(member))
                .andExpect(jsonPath("$[?(@.deviceName=='Chrome · Windows')].lastPush.status")
                        .value("SENT"));

        // The same browser signed in as someone else takes pushes for them now.
        subscribe(cookie(OTHER), "https://push.example.test/laptop", null);
        mvc.perform(get("/api/v1/push/devices").cookie(member)).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get("/api/v1/push/devices").cookie(cookie(OTHER)))
                .andExpect(jsonPath("$[0].deviceName").value("Chrome · Windows"));

        // A member ends only their own device.
        String phone = jdbc.queryForObject(
                "SELECT subscription_id FROM push_subscription WHERE endpoint='https://push.example.test/phone'",
                String.class);
        mvc.perform(write(delete("/api/v1/push/devices/" + phone)).cookie(cookie(OTHER)))
                .andExpect(status().isNotFound());
        mvc.perform(write(delete("/api/v1/push/devices/" + phone)).cookie(member))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/push/devices").cookie(member)).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(write(post("/api/v1/push/tests")).cookie(member).content("{}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PUSH_NO_DEVICE"));
        mvc.perform(write(put("/api/v1/push/devices"))
                        .cookie(member)
                        .content(subscription("http://push.example.test/plain", null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void aTestPushForOneDeviceGoesToThatDeviceOfTheCallerAlone() throws Exception {
        // The onboarding sends its test to the device it just turned on; nobody else's device may take it.
        Cookie member = cookie(MEMBER);
        String laptop = subscribe(member, "https://push.example.test/laptop", "Chrome · Windows");
        subscribe(member, "https://push.example.test/phone", "Chrome · Android");
        String others = subscribe(cookie(OTHER), "https://push.example.test/other", "Edge · Windows");

        mvc.perform(write(post("/api/v1/push/tests")).cookie(member).content("{\"subscriptionId\":\"" + laptop + "\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.devices").value(1));
        awaitCount("SELECT count(*) FROM push_delivery WHERE status='SENT'", 1);
        assertThat(jdbc.queryForList("SELECT subscription_id FROM push_delivery", String.class))
                .containsExactly(laptop);
        assertThat(jdbc.queryForList("SELECT DISTINCT recipient_id FROM push_delivery", String.class))
                .containsExactly(MEMBER.toString());

        // Another member's device id is no device of the caller's: refused, and nothing is queued for it.
        mvc.perform(write(post("/api/v1/push/tests")).cookie(member).content("{\"subscriptionId\":\"" + others + "\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PUSH_NO_DEVICE"));
        assertThat(jdbc.queryForObject(
                        "SELECT count(*) FROM push_delivery WHERE subscription_id=?", Integer.class, others))
                .isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM push_delivery", Integer.class))
                .isEqualTo(1);
    }

    @Test
    void aNoticeQueuesAPushADeviceOrSaysWhyNoneWent() throws Exception {
        Cookie member = cookie(MEMBER);
        subscribe(member, "https://push.example.test/ok", "Chrome · Mac");
        subscribe(member, "https://push.example.test/gone", "Old phone");
        when(pushGateway.send(
                        argThat(device -> device != null && device.endpoint().endsWith("/gone")), any()))
                .thenReturn(new PushGateway.PushAnswer(410, "expired", false));
        mvc.perform(write(put("/api/v1/push/preferences")).cookie(member).content("{\"mutedTopics\":[\"WORK_ITEM\"]}"))
                .andExpect(jsonPath("$.topics[?(@.topic=='WORK_ITEM')].enabled").value(false));

        // 주제에 들지 않는 알림은 늘 보내고, 꺼 둔 주제(업무)의 알림은 보내지 않는다.
        send(Notice.toSee(
                Subject.issue(UUID.randomUUID()),
                "COMMENT_MENTIONED",
                ADMIN,
                "댓글에서 나를 불렀어요",
                "DEMO-1",
                "/workspace/projects/DEMO/work-items/1",
                List.of(MEMBER, OTHER)));
        send(Notice.toSee(
                Subject.issue(UUID.randomUUID()),
                "ISSUE_ASSIGNED",
                ADMIN,
                "업무가 배정되었어요",
                "DEMO-2",
                "/workspace/projects/DEMO/work-items/2",
                List.of(MEMBER)));
        awaitCount("SELECT count(*) FROM push_delivery WHERE status IN ('SENT','GONE')", 2);
        // A notice is not a test: on screen it shows as a toast instead.
        verify(pushGateway, never()).send(any(), argThat(PushGateway.PushMessage::test));

        assertThat(jdbc.queryForList(
                        "SELECT d.status FROM push_delivery d JOIN notification_event e ON e.event_id=d.event_id"
                                + " WHERE d.recipient_id=? ORDER BY e.kind, d.status",
                        String.class,
                        MEMBER))
                .containsExactly("GONE", "SENT", "MUTED");
        assertThat(jdbc.queryForObject("SELECT status FROM push_delivery WHERE recipient_id=?", String.class, OTHER))
                .isEqualTo("NO_DEVICE");
        // The device its push service called gone takes no more pushes.
        mvc.perform(get("/api/v1/push/devices").cookie(member))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].deviceName").value("Chrome · Mac"));

        Cookie admin = cookie(ADMIN);
        mvc.perform(get("/api/v1/push-deliveries/summary").cookie(member)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/push-deliveries/summary").cookie(admin))
                .andExpect(jsonPath("$.configured").value(true))
                .andExpect(jsonPath("$.activeDevices").value(1))
                .andExpect(jsonPath("$.membersWithDevice").value(1))
                .andExpect(jsonPath("$.workingMembers").value(3))
                .andExpect(jsonPath("$.sent").value(1))
                .andExpect(jsonPath("$.gone").value(1))
                .andExpect(jsonPath("$.noDevice").value(1))
                .andExpect(jsonPath("$.muted").value(1));
        mvc.perform(get("/api/v1/push-deliveries/members?state=FAILED").cookie(admin))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("구성원"))
                .andExpect(jsonPath("$[0].devices").value(1))
                .andExpect(jsonPath("$[0].failed").value(1));
        mvc.perform(get("/api/v1/push-deliveries/members?state=NO_DEVICE").cookie(admin))
                .andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(get("/api/v1/push-deliveries/members/" + MEMBER).cookie(admin))
                .andExpect(jsonPath("$.devices", hasSize(2)))
                .andExpect(jsonPath("$.deliveries", hasSize(3)))
                .andExpect(
                        jsonPath("$.deliveries[?(@.status=='GONE')].deviceName").value("Old phone"));
        mvc.perform(write(post("/api/v1/push-deliveries/members/" + OTHER + "/tests"))
                        .cookie(admin))
                .andExpect(status().isConflict());
        // Each kind sent so far, with whom it reached, the pushes that arrived and its latest notice.
        mvc.perform(get("/api/v1/push-deliveries/kinds").cookie(member)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/push-deliveries/kinds").cookie(admin))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[?(@.kind=='COMMENT_MENTIONED')].notices").value(1))
                .andExpect(
                        jsonPath("$[?(@.kind=='COMMENT_MENTIONED')].recipients").value(2))
                .andExpect(jsonPath("$[?(@.kind=='COMMENT_MENTIONED')].pushed").value(1))
                .andExpect(
                        jsonPath("$[?(@.kind=='ISSUE_ASSIGNED')].exampleTitle").value("업무가 배정되었어요"))
                .andExpect(jsonPath("$[?(@.kind=='ISSUE_ASSIGNED')].pushed").value(0));
    }

    private void send(Notice notice) {
        transactions.executeWithoutResult(status -> notifications.send(notice));
    }

    private String subscribe(Cookie cookie, String endpoint, String name) throws Exception {
        String body = mvc.perform(
                        write(put("/api/v1/push/devices")).cookie(cookie).content(subscription(endpoint, name)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return json.readTree(body).get("id").asString();
    }

    private static String subscription(String endpoint, String name) throws Exception {
        var generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        var point = ((ECPublicKey) generator.generateKeyPair().getPublic()).getW();
        byte[] raw = new byte[65];
        raw[0] = 4;
        place(point.getAffineX().toByteArray(), raw, 1);
        place(point.getAffineY().toByteArray(), raw, 33);
        var encode = Base64.getUrlEncoder().withoutPadding();
        return "{\"endpoint\":\"" + endpoint + "\",\"p256dh\":\"" + encode.encodeToString(raw) + "\",\"auth\":\""
                + encode.encodeToString(new byte[16]) + "\"" + (name == null ? "" : ",\"deviceName\":\"" + name + "\"")
                + "}";
    }

    private static void place(byte[] value, byte[] out, int offset) {
        int start = Math.max(0, value.length - 32);
        System.arraycopy(value, start, out, offset + 32 - (value.length - start), value.length - start);
    }

    // Pushes go on another thread once the transaction commits.
    private void awaitCount(String sql, int expected) throws InterruptedException {
        Supplier<Integer> count = () -> jdbc.queryForObject(sql, Integer.class);
        for (int tries = 0; tries < 50 && count.get() < expected; tries++) Thread.sleep(100);
        assertThat(count.get()).isEqualTo(expected);
    }

    private void employee(UUID id, String name, boolean admin) {
        Accounts.upsert(jdbc, id, id + "@example.test", true, Accounts.when(admin, Role.INSTANCE_ADMIN));
        Members.insert(jdbc, Members.member(id, name, id + "@example.test"));
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

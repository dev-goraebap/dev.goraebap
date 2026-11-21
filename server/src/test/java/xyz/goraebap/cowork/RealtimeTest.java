package xyz.goraebap.cowork;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.support.TransactionTemplate;
import xyz.goraebap.cowork.module.realtime.RealtimeFacade;
import xyz.goraebap.cowork.module.realtime.Signal;
import xyz.goraebap.cowork.module.user.application.auth.SessionService;
import xyz.goraebap.cowork.support.Members;
import xyz.goraebap.cowork.support.TestDatabase;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class RealtimeTest {
    private static final UUID HANA = id(1);
    private static final UUID DUNA = id(2);

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    SessionService sessions;

    @Autowired
    RealtimeFacade realtime;

    @Autowired
    TransactionTemplate transaction;

    @BeforeEach
    void prepare() {
        TestDatabase.clear(jdbc);
        member(HANA, "김하나", "hana@example.test");
        member(DUNA, "이두나", "duna@example.test");
    }

    @Test
    void aStreamIsOpenOnlyToASignedInMember() throws Exception {
        mvc.perform(get("/api/v1/events")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/events").cookie(cookie(HANA)))
                .andExpect(request().asyncStarted());
    }

    @Test
    void aSignalReachesItsRecipientsOnlyOnceTheChangeCommits() throws Exception {
        MvcResult hana = open(HANA);
        MvcResult duna = open(DUNA);
        UUID rolledBack = UUID.randomUUID();
        UUID committed = UUID.randomUUID();
        UUID toEveryone = UUID.randomUUID();

        transaction.executeWithoutResult(status -> {
            realtime.signal(Signal.to(Signal.Topic.ISSUES, rolledBack, List.of(HANA)));
            status.setRollbackOnly();
        });
        transaction.executeWithoutResult(status -> {
            realtime.signal(Signal.to(Signal.Topic.ISSUES, committed, List.of(HANA)));
            // Still inside the transaction: nothing has left yet.
            assertThat(content(hana)).doesNotContain(committed.toString());
        });
        // Outside any transaction a signal leaves at once.
        realtime.signal(Signal.toEveryone(Signal.Topic.DOCUMENTS, toEveryone));

        assertThat(content(hana))
                .contains("event:signal")
                .contains("\"topic\":\"ISSUES\"")
                .contains(committed.toString())
                .contains(toEveryone.toString())
                .doesNotContain(rolledBack.toString());
        assertThat(content(duna)).contains(toEveryone.toString()).doesNotContain(committed.toString());
    }

    private MvcResult open(UUID member) throws Exception {
        return mvc.perform(get("/api/v1/events").cookie(cookie(member)))
                .andExpect(request().asyncStarted())
                .andReturn();
    }

    /** What the stream has written so far. */
    private static String content(MvcResult result) {
        return new String(result.getResponse().getContentAsByteArray(), java.nio.charset.StandardCharsets.UTF_8);
    }

    private void member(UUID id, String name, String email) {
        jdbc.update(
                "INSERT INTO users(user_id,email) VALUES (?,?)"
                        + " ON CONFLICT(user_id) DO UPDATE SET email=excluded.email",
                id,
                email);
        Members.insert(jdbc, Members.member(id, name, email));
    }

    private Cookie cookie(UUID user) {
        return new Cookie("cowork_session", sessions.issue(user).token());
    }

    private static UUID id(int value) {
        return UUID.fromString(String.format("00000000-0000-0000-0000-%012d", value));
    }
}

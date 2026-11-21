package xyz.goraebap;

import static org.hamcrest.Matchers.greaterThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import xyz.goraebap.foundation.system.infrastructure.LogWriter;
import xyz.goraebap.foundation.user.application.auth.SessionService;
import xyz.goraebap.support.Accounts;
import xyz.goraebap.support.Members;
import xyz.goraebap.support.TestDatabase;

/**
 * A log database that cannot be opened (its folder is a file) never stops the server: members go on working, the
 * status page says the store is failing and how many records were lost, and the record lists answer that they cannot
 * be read.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class SystemLogStoreDownTest {
    private static final UUID ADMIN = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    SessionService sessions;

    @Autowired
    LogWriter logWriter;

    @DynamicPropertySource
    static void brokenStore(DynamicPropertyRegistry registry) {
        try {
            Path notAFolder =
                    Files.createDirectories(Path.of("build/test-db")).resolve("not-a-folder-" + UUID.randomUUID());
            Files.writeString(notAFolder, "a file where a folder should be");
            registry.add(
                    "app.system.log-db", () -> notAFolder.resolve("logs.db").toString());
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @org.junit.jupiter.api.Disabled("오피스를 뺀 뒤 깨짐: 오피스 주소나 도구를 썼다. 워크스페이스 기준으로 다시 쓴다.")
    @Test
    void theServerGoesOnAndThePageSaysTheStoreIsFailing() throws Exception {
        TestDatabase.clear(jdbc);
        Accounts.upsert(jdbc, ADMIN, "a@example.test", true, Accounts.all());
        Members.insert(
                jdbc,
                Members.member(ADMIN, "관리자", "a@example.test")
                        .invitedAt(java.time.Instant.parse("2024-01-01T00:00:00.000000Z")));
        Cookie admin = new Cookie("cowork_session", sessions.issue(ADMIN).token());

        mvc.perform(get("/api/v1/office/employees/" + ADMIN).cookie(admin)).andExpect(status().isOk());
        logWriter.flush();

        mvc.perform(get("/api/v1/system/status").cookie(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logStore.ok").value(false))
                .andExpect(jsonPath("$.logStore.failingSince").exists())
                .andExpect(jsonPath("$.logStore.lost").value(greaterThan(0)))
                .andExpect(jsonPath("$.lastBackup").doesNotExist());
        mvc.perform(get("/api/v1/system/activities").cookie(admin))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("SYSTEM_LOG_UNAVAILABLE"));
        mvc.perform(get("/api/v1/system/traffic").cookie(admin)).andExpect(status().isServiceUnavailable());
    }
}

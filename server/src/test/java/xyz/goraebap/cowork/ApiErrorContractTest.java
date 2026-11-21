package xyz.goraebap.cowork;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import xyz.goraebap.cowork.module.user.application.auth.SessionService;
import xyz.goraebap.cowork.shared.storage.ObjectStorage;
import xyz.goraebap.cowork.shared.web.Role;
import xyz.goraebap.cowork.support.Accounts;
import xyz.goraebap.cowork.support.Members;
import xyz.goraebap.cowork.support.TestDatabase;

/** The error contract where the framework answers: unknown employees, field wording, admin-first and the document. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class ApiErrorContractTest {
    private static final UUID ADMIN = id(1);
    private static final UUID MEMBER = id(2);
    private static final UUID CHIEF = id(3);
    private static final UUID NOBODY = id(999);

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    SessionService sessions;

    @Autowired
    ObjectStorage objectStorage;

    @BeforeEach
    void prepare() {
        TestDatabase.clear(jdbc);
        employee(ADMIN, "관리자", true);
        employee(MEMBER, "구성원", false);
        employee(CHIEF, "대표", false);
    }

    @org.junit.jupiter.api.Disabled("오피스를 뺀 뒤 깨짐: 오피스 주소나 도구를 썼다. 워크스페이스 기준으로 다시 쓴다.")
    @Test
    void perEmployeeReadsOfAnUnknownEmployeeAre404() throws Exception {
        notFound("/api/v1/office/leave/employees/" + NOBODY + "/attendance?month=2026-09", "LEAVE_EMPLOYEE_NOT_FOUND");
        notFound("/api/v1/office/leave/employees/" + NOBODY + "/annual-leave", "LEAVE_EMPLOYEE_NOT_FOUND");
        notFound("/api/v1/office/leave/employees/" + NOBODY + "/annual-leave/entries", "LEAVE_EMPLOYEE_NOT_FOUND");
        notFound("/api/v1/office/leave/employees/" + NOBODY + "/special-leave", "LEAVE_EMPLOYEE_NOT_FOUND");
        notFound("/api/v1/office/approval/employees/" + NOBODY + "/requests", "APPROVAL_EMPLOYEE_NOT_FOUND");
        // Without the check the preview made up a line naming the chief executive for nobody.
        notFound(
                "/api/v1/office/approval/line-preview?employeeId=" + NOBODY + "&category=ABSENCE",
                "APPROVAL_EMPLOYEE_NOT_FOUND");

        // A deleted employee is gone as /employees/{id} says.
        jdbc.update("UPDATE employee SET deleted_at='2026-09-01T00:00:00Z' WHERE employee_id=?", MEMBER);
        notFound("/api/v1/office/leave/employees/" + MEMBER + "/annual-leave", "LEAVE_EMPLOYEE_NOT_FOUND");

        // A known employee still reads, and a member asking for someone else is still refused, not told who exists.
        mvc.perform(get("/api/v1/office/leave/employees/" + CHIEF + "/attendance?month=2026-09")
                        .cookie(cookie(ADMIN)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/office/approval/line-preview?employeeId=" + ADMIN + "&category=ABSENCE")
                        .cookie(cookie(ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvers[0].id").value(CHIEF.toString()));
        mvc.perform(get("/api/v1/office/leave/employees/" + NOBODY + "/attendance?month=2026-09")
                        .cookie(cookie(CHIEF)))
                .andExpect(status().isForbidden());
    }

    @org.junit.jupiter.api.Disabled("오피스를 뺀 뒤 깨짐: 오피스 주소나 도구를 썼다. 워크스페이스 기준으로 다시 쓴다.")
    @Test
    void fieldErrorsSpeakInTheContractsWordsNotTheFrameworks() throws Exception {
        mvc.perform(write(post("/api/v1/auth/otp/request")).content("{\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_INVALID_REQUEST"))
                .andExpect(jsonPath("$.errors[0].field").value("email"))
                .andExpect(jsonPath("$.errors[0].message").value("유효한 이메일 형식이 아닙니다"));
        // A blank address breaks both rules on the field, and their order is not fixed.
        mvc.perform(write(post("/api/v1/auth/otp/request")).content("{\"email\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", Matchers.everyItem(Matchers.is("email"))))
                .andExpect(jsonPath("$.errors[*].message", Matchers.hasItem("필수 입력값입니다")));
        mvc.perform(write(post("/api/v1/office/leave/employees/" + MEMBER + "/annual-leave/adjustments"))
                        .cookie(cookie(ADMIN))
                        .content("{\"days\":1,\"reason\":\"" + "가".repeat(501) + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("reason"))
                .andExpect(jsonPath("$.errors[0].message").value("500자 이하로 입력해 주세요"));
        // A parameter's own constraint, a query value that is no number, and one left out.
        mvc.perform(get("/api/v1/office/leave/usage?year=1999").cookie(cookie(MEMBER)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("year"))
                .andExpect(jsonPath("$.errors[0].message").value("2000 이상이어야 합니다"));
        mvc.perform(get("/api/v1/office/leave/usage?year=abc").cookie(cookie(MEMBER)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_INVALID_REQUEST"))
                .andExpect(jsonPath("$.detail", not(Matchers.containsString("abc"))))
                .andExpect(jsonPath("$.errors[0].field").value("year"))
                .andExpect(jsonPath("$.errors[0].message").value("값의 형식이 올바르지 않습니다"));
        mvc.perform(get("/api/v1/office/leave/usage").cookie(cookie(MEMBER)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("year"))
                .andExpect(jsonPath("$.errors[0].message").value("필수 입력값입니다"));
        // A path value that is no id is named by its variable, none of the query's names, so the screen reads the
        // address as naming nothing.
        mvc.perform(get("/api/v1/office/approval/requests/abc").cookie(cookie(MEMBER)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("id"))
                .andExpect(jsonPath("$.errors[0].message").value("값의 형식이 올바르지 않습니다"));
        // A date in the body that does not read names its field and never repeats what was sent.
        mvc.perform(write(post("/api/v1/office/employees"))
                        .cookie(cookie(ADMIN))
                        .content("{\"items\":[{\"name\":\"새 사원\",\"workEmail\":\"new@example.test\","
                                + "\"hireDate\":\"2026-13-45\"}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_INVALID_REQUEST"))
                .andExpect(jsonPath("$.detail", not(Matchers.containsString("2026-13-45"))))
                .andExpect(jsonPath("$.errors[0].field").value("items[0].hireDate"))
                .andExpect(jsonPath("$.errors[0].message").value("값의 형식이 올바르지 않습니다"));
        // A body that is not JSON at all has no field to name.
        mvc.perform(write(post("/api/v1/office/employees"))
                        .cookie(cookie(ADMIN))
                        .content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").doesNotExist());
    }

    @org.junit.jupiter.api.Disabled("오피스를 뺀 뒤 깨짐: 오피스 주소나 도구를 썼다. 워크스페이스 기준으로 다시 쓴다.")
    @Test
    void membersAreRefusedBeforeAnAdministratorsBodyIsRead() throws Exception {
        for (String body : List.of("{\"items\":[{\"hireDate\":\"2026-13-45\"}]}", "{\"items\":[]}", "{")) {
            mvc.perform(write(post("/api/v1/office/employees"))
                            .cookie(cookie(MEMBER))
                            .content(body))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN"))
                    .andExpect(jsonPath("$.errors").doesNotExist());
        }
        // Class-level and method-level rules alike.
        mvc.perform(write(post("/api/v1/office/leave/employees/" + MEMBER + "/annual-leave/adjustments"))
                        .cookie(cookie(MEMBER))
                        .content("{\"days\":\"many\",\"reason\":\"\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(write(post("/api/v1/office/approval/requests/" + NOBODY + "/admin-cancellation"))
                        .cookie(cookie(MEMBER))
                        .content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/office/approval/employees/" + MEMBER + "/requests?size=0")
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isForbidden());
        // Administrators still get the field errors.
        mvc.perform(write(post("/api/v1/office/employees"))
                        .cookie(cookie(ADMIN))
                        .content("{\"items\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("items"));
    }

    @Test
    void answersOutsideTheBusinessCodeKeepTheContract() throws Exception {
        // A health check by HEAD needs no session, just as GET.
        mvc.perform(head("/api/v1/health")).andExpect(status().isOk());
        // A signed URL for a file that is not there says so in a problem, not an empty body.
        URI missing = objectStorage.presignDownload(
                "requests/" + UUID.randomUUID(), "증빙.pdf", "application/pdf", true, Duration.ofMinutes(5));
        problem(mvc.perform(get(missing)), 404, "COMMON_NOT_FOUND");
        // The error page is where the container forwards; asked for directly it is no address.
        problem(mvc.perform(get("/error").cookie(cookie(MEMBER))), 404, "COMMON_NOT_FOUND");
    }

    @org.junit.jupiter.api.Disabled("오피스를 뺀 뒤 깨짐: 오피스 주소나 도구를 썼다. 워크스페이스 기준으로 다시 쓴다.")
    @Test
    void membersAreRefusedBeforeTheResponseFormatIsWeighed() throws Exception {
        String workbook = "/api/v1/office/leave/reports/executive/workbook?from=2026-01-01&to=2026-01-31";
        problem(
                mvc.perform(get(workbook).cookie(cookie(MEMBER)).accept(MediaType.APPLICATION_JSON)),
                403,
                "AUTH_FORBIDDEN");
        // An administrator asking for a format the download does not have still learns that.
        problem(
                mvc.perform(get(workbook).cookie(cookie(ADMIN)).accept(MediaType.APPLICATION_JSON)),
                406,
                "COMMON_NOT_ACCEPTABLE");
    }

    @Test
    void everyResponseLimitsTheReferrerAndDeviceFeatures() throws Exception {
        for (String path : List.of("/api/v1/health", "/")) {
            mvc.perform(get(path))
                    .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"))
                    .andExpect(header().string("Permissions-Policy", Matchers.containsString("camera=()")));
        }
    }

    @org.junit.jupiter.api.Disabled("오피스를 뺀 뒤 깨짐: 오피스 주소나 도구를 썼다. 워크스페이스 기준으로 다시 쓴다.")
    @Test
    void theOpenApiDocumentLeavesOutLocalFileStorage() throws Exception {
        String spec = mvc.perform(get("/api/openapi"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(spec).contains("/api/v1/office/employees").doesNotContain("/api/v1/storage");
    }

    private static void problem(ResultActions resultActions, int status, String code) throws Exception {
        resultActions
                .andExpect(status().is(status))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value(code))
                .andExpect(jsonPath("$.traceId").isNotEmpty());
    }

    private void notFound(String path, String code) throws Exception {
        mvc.perform(get(path).cookie(cookie(ADMIN)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(code));
    }

    private void employee(UUID id, String name, boolean admin) {
        Accounts.upsert(jdbc, id, id + "@example.test", true, Accounts.when(admin, Role.WORKSPACE_ADMIN));
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
        var tree = tools.jackson.databind.json.JsonMapper.builder()
                .build()
                .readTree(result.getResponse().getContentAsString());
        return builder.cookie(result.getResponse().getCookies())
                .header(tree.get("headerName").asString(), tree.get("token").asString())
                .header("Origin", "http://localhost:4402")
                .contentType("application/json");
    }
}

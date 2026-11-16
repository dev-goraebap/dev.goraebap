package xyz.goraebap.workspace;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import xyz.goraebap.workspace.support.WorkspaceTestDatabase;
import xyz.goraebap.workspace.WorkspaceRoles;
import jakarta.servlet.http.Cookie;
import java.time.LocalDate;
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
 * A project's issues on BIT's work items: numbered from the project's counter (an old key still finds them), read by
 * the project's members, commented on by its viewers and written by its editors while the project is not archived; its
 * administrators keep the board, and Workspace administrators the labels. The
 * body saves over its version with its own versions, each save and comment on its timeline; the board moves issues between columns.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class IssuesTest {
    private static final UUID ADMIN = id(1);
    private static final UUID MEMBER = id(2);
    private static final UUID OTHER = id(3);
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
        member(OTHER, "다동료", "other@example.test");
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(ADMIN))
                        .content("{\"key\":\"SAFE\",\"name\":\"안전플랫폼\"}"))
                .andExpect(status().isCreated());
        ProjectMembers.editors(jdbc, "SAFE", MEMBER, OTHER);
    }

    @Test
    void aNewProjectHasBitsBoardAndIssuesTakeItsNumbers() throws Exception {
        mvc.perform(get("/api/v1/workspace/projects/SAFE/columns").cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name").value(contains("백로그", "할 일", "진행 중", "검토 중", "완료", "취소")))
                .andExpect(jsonPath("$[*].category")
                        .value(contains("BACKLOG", "UNSTARTED", "STARTED", "STARTED", "COMPLETED", "CANCELED")));

        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues"))
                        .cookie(cookie(MEMBER))
                        .content("{\"title\":\"로그인 오류\",\"type\":\"BUG\",\"priority\":\"HIGH\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/workspace/projects/SAFE/issues/1"));
        create("두 번째");
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(OTHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.issue.ref").value("SAFE-1"))
                .andExpect(jsonPath("$.issue.columnName").value("할 일"))
                .andExpect(jsonPath("$.issue.type").value("BUG"))
                .andExpect(jsonPath("$.createdByName").value("나구성원"))
                .andExpect(jsonPath("$.canWrite").value(true));

        // A new key keeps the old one: SAFE-2 is still found, and the number goes on from the project's counter.
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE"))
                        .cookie(cookie(ADMIN))
                        .content("{\"expectedVersion\":0,\"key\":\"SP\",\"name\":\"안전플랫폼\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/issues/SAFE-2").cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.issue.ref").value("SP-2"));
        create("세 번째", "SP");
        mvc.perform(get("/api/v1/workspace/issues/sp-3").cookie(cookie(MEMBER))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/workspace/issues/SP-9").cookie(cookie(MEMBER))).andExpect(status().isNotFound());
        assertThat(jdbc.queryForObject("SELECT last_work_item_number FROM project", Long.class))
                .isEqualTo(3);
    }

    @Test
    void propertiesChangeOverTheirVersionAndTellTheNewAssignee() throws Exception {
        create("화면 정리");
        var issue = issue("SAFE", 1);
        UUID doing = column("SAFE", "진행 중");
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE/issues/1"))
                        .cookie(cookie(MEMBER))
                        .content(edit(0, "화면 정리하기", doing, OTHER, "2026-11-10")))
                .andExpect(status().isNoContent());
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE/issues/1"))
                        .cookie(cookie(MEMBER))
                        .content(edit(0, "늦은 고침", doing, null, null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ISSUE_VERSION_CONFLICT"));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.title").value("화면 정리하기"))
                .andExpect(jsonPath("$.issue.assigneeName").value("다동료"))
                .andExpect(jsonPath("$.issue.columnName").value("진행 중"))
                .andExpect(jsonPath("$.issue.dueDate").value("2026-11-10"))
                .andExpect(jsonPath("$.issue.version").value(1));
        assertThat(issue).isNotNull();
        assertThat(jdbc.queryForObject(
                        "SELECT count(*) FROM notification_recipient r JOIN notification_event e ON e.event_id = r.event_id"
                                + " WHERE e.kind = 'ISSUE_ASSIGNED' AND r.recipient_id = ?",
                        Integer.class,
                        OTHER.toString()))
                .isEqualTo(1);
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1/timeline").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[*].field")
                        .value(contains("CREATED", "TITLE", "STATUS", "ASSIGNEE", "START_DATE", "DUE_DATE")))
                .andExpect(jsonPath("$[2].before").value("할 일"))
                .andExpect(jsonPath("$[2].after").value("진행 중"))
                .andExpect(jsonPath("$[3].after").value("다동료"));
    }

    @Test
    void theBoardMovesIssuesBetweenNeighboursAndClosesThemInDone() throws Exception {
        create("하나");
        create("둘");
        create("셋");
        UUID todo = column("SAFE", "할 일");
        UUID done = column("SAFE", "완료");
        // 셋 goes first, then 하나 after 둘.
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/3/move"))
                        .cookie(cookie(MEMBER))
                        .content("{\"columnId\":\"" + todo + "\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/1/move"))
                        .cookie(cookie(MEMBER))
                        .content("{\"columnId\":\"" + todo + "\",\"afterId\":\"" + issue("SAFE", 2) + "\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.items[*].title").value(contains("셋", "둘", "하나")));

        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/2/move"))
                        .cookie(cookie(MEMBER))
                        .content("{\"columnId\":\"" + done + "\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/2").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.category").value("COMPLETED"))
                .andExpect(jsonPath("$.issue.closedAt").isNotEmpty());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues?category=COMPLETED,CANCELED")
                        .cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.items[*].title").value(contains("둘")));

        // A column with issues cannot go; administrators alone change the board.
        mvc.perform(write(delete("/api/v1/workspace/projects/SAFE/columns/" + done))
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isForbidden());
        mvc.perform(write(delete("/api/v1/workspace/projects/SAFE/columns/" + done))
                        .cookie(cookie(ADMIN)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ISSUE_COLUMN_NOT_EMPTY"));
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/columns"))
                        .cookie(cookie(ADMIN))
                        .content("{\"name\":\"배포 대기\",\"category\":\"STARTED\"}"))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/columns").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$", hasSize(7)));
    }

    @Test
    void listsFilterByStatusAssigneeLabelTypeAndText() throws Exception {
        mvc.perform(write(post("/api/v1/workspace/work-item-labels"))
                        .cookie(cookie(MEMBER))
                        .content("{\"name\":\"프론트\",\"color\":\"#5E6AD2\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(write(post("/api/v1/workspace/work-item-labels"))
                        .cookie(cookie(ADMIN))
                        .content("{\"name\":\"프론트\",\"color\":\"#5E6AD2\"}"))
                .andExpect(status().isCreated());
        mvc.perform(write(post("/api/v1/workspace/work-item-labels"))
                        .cookie(cookie(ADMIN))
                        .content("{\"name\":\"프론트\",\"color\":\"#000000\"}"))
                .andExpect(status().isConflict());
        UUID label = uuid(jdbc.queryForList("SELECT label_id FROM issue_label", String.class)
                .getFirst());
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues"))
                        .cookie(cookie(MEMBER))
                        .content("{\"title\":\"버튼 색\",\"type\":\"BUG\",\"assigneeId\":\"" + MEMBER
                                + "\",\"labelIds\":[\"" + label + "\"]}"))
                .andExpect(status().isCreated());
        create("서버 로그");
        create("문서 정리");

        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues?assignee=me").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.items[*].title").value(contains("버튼 색")))
                .andExpect(jsonPath("$.items[0].labels[0].name").value("프론트"));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues?assignee=none").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.items", hasSize(2)));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues?labelId=" + label)
                        .cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.items", hasSize(1)));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues?type=TASK").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.items[*].title").value(containsInAnyOrder("서버 로그", "문서 정리")));
        mvc.perform(get("/api/v1/workspace/issues?q=SAFE-2").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.items[*].title").value(contains("서버 로그")));
        mvc.perform(get("/api/v1/workspace/issues?q=정리&project=SAFE").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.items[*].ref").value(contains("SAFE-3")));
        // A slice at a time: two, then the last one, newest first across the area.
        String next = JSON.readTree(
                        mvc.perform(get("/api/v1/workspace/issues?size=2").cookie(cookie(MEMBER)))
                                .andExpect(jsonPath("$.items", hasSize(2)))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("nextCursor")
                .asText();
        mvc.perform(get("/api/v1/workspace/issues?size=2&cursor=" + next).cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.nextCursor").value(nullValue()));
        // Deleting the label takes it off its issues.
        mvc.perform(write(delete("/api/v1/workspace/work-item-labels/" + label)).cookie(cookie(ADMIN)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.labels", hasSize(0)));
    }

    @Test
    void workItemTypesAreTheWorkspacesAndATypeInUseStays() throws Exception {
        mvc.perform(get("/api/v1/workspace/work-item-types").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[*].code").value(contains("TASK", "BUG", "FEATURE", "EPIC", "STORY")))
                .andExpect(jsonPath("$[0].isDefault").value(true));
        String type = "{\"name\":\"리서치\",\"icon\":\"lookup\",\"color\":\"#20B2A0\",\"isDefault\":false}";
        mvc.perform(write(post("/api/v1/workspace/work-item-types"))
                        .cookie(cookie(MEMBER))
                        .content(type))
                .andExpect(status().isForbidden());
        String made = java.util.Objects.requireNonNull(mvc.perform(write(post("/api/v1/workspace/work-item-types"))
                        .cookie(cookie(ADMIN))
                        .content(type))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        String code = made.substring(made.lastIndexOf('/') + 1);
        mvc.perform(write(post("/api/v1/workspace/work-item-types"))
                        .cookie(cookie(ADMIN))
                        .content(type))
                .andExpect(status().isConflict());
        // A work item takes the type by its code, or the default when none is named.
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues"))
                        .cookie(cookie(MEMBER))
                        .content("{\"title\":\"사용자 인터뷰\",\"type\":\"" + code + "\"}"))
                .andExpect(status().isCreated());
        create("유형 없이");
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/2").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.type").value("TASK"));
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues"))
                        .cookie(cookie(MEMBER))
                        .content("{\"title\":\"없는 유형\",\"type\":\"NOPE\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ISSUE_TYPE_NOT_FOUND"));
        // In use, and the default, a type stays; a new default replaces the old.
        mvc.perform(write(delete("/api/v1/workspace/work-item-types/" + code)).cookie(cookie(ADMIN)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ISSUE_TYPE_IN_USE"));
        mvc.perform(write(patch("/api/v1/workspace/work-item-types/BUG"))
                        .cookie(cookie(ADMIN))
                        .content("{\"name\":\"결함\",\"icon\":\"bug\",\"color\":\"#eb5757\",\"isDefault\":true}"))
                .andExpect(status().isNoContent());
        create("기본이 바뀐 뒤");
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/3").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.type").value("BUG"));
        mvc.perform(write(delete("/api/v1/workspace/work-item-types/BUG")).cookie(cookie(ADMIN)))
                .andExpect(status().isConflict());
        mvc.perform(write(put("/api/v1/workspace/work-item-types/order"))
                        .cookie(cookie(ADMIN))
                        .content("{\"codes\":[\"" + code + "\",\"EPIC\",\"FEATURE\",\"BUG\",\"TASK\",\"STORY\"]}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/work-item-types").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[0].code").value(code))
                .andExpect(jsonPath("$[0].uses").value(1))
                .andExpect(jsonPath("$[3].name").value("결함"))
                .andExpect(jsonPath("$[3].isDefault").value(true));
    }

    @Test
    void anArchivedProjectsIssuesAreReadOnlyAndADeletedProjectsAreGone() throws Exception {
        create("보관 전");
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/archive"))
                        .cookie(cookie(ADMIN))
                        .content("{\"expectedVersion\":0}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canWrite").value(false));
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues"))
                        .cookie(cookie(MEMBER))
                        .content("{\"title\":\"새것\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ISSUE_PROJECT_ARCHIVED"));
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/1/comments"))
                        .cookie(cookie(MEMBER))
                        .content("{\"body\":\"댓글\"}"))
                .andExpect(status().isConflict());
        mvc.perform(write(delete("/api/v1/workspace/projects/SAFE?expectedVersion=1"))
                        .cookie(cookie(ADMIN)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(MEMBER)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/workspace/issues").cookie(cookie(MEMBER))).andExpect(jsonPath("$.items", hasSize(0)));
    }

    @Test
    void subIssuesStayInTheProjectAndNeverLoop() throws Exception {
        create("에픽");
        UUID epic = issue("SAFE", 1);
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues"))
                        .cookie(cookie(MEMBER))
                        .content("{\"title\":\"하위\",\"parentId\":\"" + epic + "\"}"))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.children[*].title").value(contains("하위")))
                .andExpect(jsonPath("$.issue.childCount").value(1));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/2").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.parent.ref").value("SAFE-1"));
        // The epic cannot go under its own child.
        String body = "{\"expectedVersion\":0,\"title\":\"에픽\",\"type\":\"EPIC\",\"columnId\":\""
                + column("SAFE", "할 일") + "\",\"priority\":\"NONE\",\"parentId\":\"" + issue("SAFE", 2) + "\"}";
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE/issues/1"))
                        .cookie(cookie(MEMBER))
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ISSUE_PARENT_INVALID"));
    }

    @Test
    void commentsAreEditedAndDeletedByTheirWriter() throws Exception {
        create("논의");
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/1/comments"))
                        .cookie(cookie(MEMBER))
                        .content("{\"body\":\"확인했습니다\"}"))
                .andExpect(status().isCreated());
        UUID comment =
                uuid(jdbc.queryForList("SELECT entry_id FROM activity_entry WHERE kind = 'COMMENT'", String.class)
                        .getFirst());
        String at = "/api/v1/workspace/projects/SAFE/issues/1/comments/" + comment;
        mvc.perform(write(patch(at)).cookie(cookie(OTHER)).content("{\"body\":\"남의 것\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(write(patch(at)).cookie(cookie(MEMBER)).content("{\"body\":\"확인했고 고칩니다\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1/timeline").cookie(cookie(OTHER)))
                .andExpect(jsonPath("$[1].kind").value("COMMENT"))
                .andExpect(jsonPath("$[1].body").value("확인했고 고칩니다"))
                .andExpect(jsonPath("$[1].editedAt").isNotEmpty());
        mvc.perform(write(delete(at)).cookie(cookie(OTHER))).andExpect(status().isForbidden());
        mvc.perform(write(delete(at)).cookie(cookie(MEMBER))).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1/timeline").cookie(cookie(OTHER)))
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[1].field").value("COMMENT_EDITED"))
                .andExpect(jsonPath("$[2].field").value("COMMENT_DELETED"));
    }

    @Test
    void theBodySavesOverItsVersionKeepsVersionsAndCarriesCommentThreads() throws Exception {
        create("본문");
        String body = "/api/v1/workspace/projects/SAFE/issues/1/body";
        mvc.perform(get(body).cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(0))
                .andExpect(jsonPath("$.body").value(nullValue()));
        mvc.perform(write(put(body)).cookie(cookie(MEMBER)).content(save(0, "첫 문장", false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.versions", hasSize(0)));
        // A save over a version read before conflicts.
        mvc.perform(write(put(body)).cookie(cookie(OTHER)).content(save(0, "늦은 글", false)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("RICH_BODY_VERSION_CONFLICT"));
        // The first change keeps the body before it; a checkpoint keeps this one too.
        mvc.perform(write(put(body)).cookie(cookie(MEMBER)).content(save(1, "둘째 문장", true)))
                .andExpect(jsonPath("$.version").value(2))
                .andExpect(jsonPath("$.versions[*].reason").value(contains("automatic", "baseline")));

        // A comment written on a passage of the body quotes it on the issue's timeline, after the saves of the body.
        String issue = body.substring(0, body.length() - "/body".length());
        mvc.perform(write(post(issue + "/comments"))
                        .cookie(cookie(OTHER))
                        .content("{\"body\":\"이 문장 맞나요?\",\"quote\":\"둘째 문장\"}"))
                .andExpect(status().isCreated());
        mvc.perform(get(issue + "/timeline").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[?(@.field == 'BODY')]", hasSize(2)))
                .andExpect(jsonPath("$[-1].kind").value("COMMENT"))
                .andExpect(jsonPath("$[-1].actorName").value("다동료"))
                .andExpect(jsonPath("$[-1].quote").value("둘째 문장"));

        // Restoring the version before the first change makes it the body again, as a new version.
        var state = state(body);
        String baseline = null;
        for (JsonNode version : state.path("versions"))
            if (version.path("reason").asText().equals("baseline"))
                baseline = version.path("id").asText();
        mvc.perform(write(post(body + "/revisions/" + baseline + "/restore"))
                        .cookie(cookie(MEMBER))
                        .content("{\"expectedVersion\":2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(3))
                .andExpect(jsonPath("$.body.content[0].content[0].text").value("첫 문장"))
                .andExpect(jsonPath("$.versions[0].reason").value("restored"));
    }

    @Test
    void aBodyNamesOnlyItsOwnFiles() throws Exception {
        create("파일");
        String unknown = "{\"expectedVersion\":0,\"body\":{\"type\":\"doc\",\"content\":[{\"type\":\"media\",\"attrs\":"
                + "{\"src\":\"attachment:" + UUID.randomUUID() + "\"}}]},\"checkpoint\":false}";
        mvc.perform(write(put("/api/v1/workspace/projects/SAFE/issues/1/body"))
                        .cookie(cookie(MEMBER))
                        .content(unknown))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("RICH_BODY_FILE_UNKNOWN"));
    }

    @Test
    void boardCountsUseTheSameFiltersWhileEachColumnHasItsOwnCursor() throws Exception {
        for (int index = 0; index < 35; index++) create("목록 " + index);
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues"))
                        .cookie(cookie(MEMBER))
                        .content("{\"title\":\"긴급 확인\",\"type\":\"BUG\",\"priority\":\"HIGH\",\"assigneeId\":\""
                                + MEMBER + "\"}"))
                .andExpect(status().isCreated());
        var groups = JSON.readTree(mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/groups")
                        .param("grouping", "STATUS")
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].total").value(36))
                .andReturn()
                .getResponse()
                .getContentAsString());
        String column = groups.get(0).path("columnIds").get(0).asText();
        var seen = new java.util.HashSet<String>();
        String cursor = null;
        int pages = 0;
        do {
            var query = get("/api/v1/workspace/issues")
                    .param("columnId", column)
                    .param("size", "10")
                    .param("sort", "UPDATED");
            if (cursor != null) query.param("cursor", cursor);
            var slice = JSON.readTree(mvc.perform(query.cookie(cookie(MEMBER)))
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString());
            for (var item : slice.path("items")) {
                assertThat(item.path("columnId").asText()).isEqualTo(column);
                assertThat(seen.add(item.path("id").asText())).isTrue();
            }
            cursor = slice.path("nextCursor").isNull()
                            || slice.path("nextCursor").isMissingNode()
                    ? null
                    : slice.path("nextCursor").asText();
            pages++;
        } while (cursor != null && pages < 10);
        assertThat(seen).hasSize(36);
        assertThat(pages).isEqualTo(4);
        mvc.perform(get("/api/v1/workspace/issues/groups")
                        .param("grouping", "ASSIGNEE")
                        .param("priority", "HIGH")
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("나구성원"))
                .andExpect(jsonPath("$[0].total").value(1));
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(ADMIN))
                        .content("{\"key\":\"NEXT\",\"name\":\"다른 프로젝트\"}"))
                .andExpect(status().isCreated());
        ProjectMembers.editors(jdbc, "NEXT", MEMBER, OTHER);
        create("다른 프로젝트 업무", "NEXT");
        mvc.perform(get("/api/v1/workspace/issues/groups")
                        .param("grouping", "STATUS")
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].columnIds", hasSize(2)))
                .andExpect(jsonPath("$[0].total").value(37));
        mvc.perform(get("/api/v1/workspace/issues/groups")
                        .param("grouping", "TYPE")
                        .param("project", "MISSING")
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
        mvc.perform(get("/api/v1/workspace/issues/groups")
                        .param("grouping", "NONE")
                        .param("q", "SAFE-36")
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].total").value(1));
        mvc.perform(get("/api/v1/workspace/issues/groups")
                        .param("grouping", "INVALID")
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isBadRequest());
        jdbc.update("UPDATE project SET deleted_at='2026-11-05T00:00:00Z' WHERE name='다른 프로젝트'");
        mvc.perform(get("/api/v1/workspace/issues/groups")
                        .param("grouping", "STATUS")
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].total").value(36));
    }

    @Test
    void aStatusFillsWhatItSaysWhenAnIssueGetsThere() throws Exception {
        String today = LocalDate.now(java.time.ZoneId.of("Asia/Seoul")).toString();
        UUID todo = column("SAFE", "할 일");
        UUID doing = column("SAFE", "진행 중");
        UUID done = column("SAFE", "완료");
        // Made with no priority said, it is an ordinary one; nobody holds it and nothing is dated yet.
        create("하나");
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.priority").value("MEDIUM"))
                .andExpect(jsonPath("$.issue.assigneeId").doesNotExist())
                .andExpect(jsonPath("$.issue.startedAt").doesNotExist());
        // Under way: whoever moved it holds it, it starts today, and the moment is kept. Its due date stays empty.
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/1/move"))
                        .cookie(cookie(MEMBER))
                        .content("{\"columnId\":\"" + doing + "\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.assigneeId").value(MEMBER.toString()))
                .andExpect(jsonPath("$.issue.startDate").value(today))
                .andExpect(jsonPath("$.issue.startedAt").isNotEmpty())
                .andExpect(jsonPath("$.issue.dueDate").doesNotExist());
        // Done: with no due date it was due today.
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/1/move"))
                        .cookie(cookie(MEMBER))
                        .content("{\"columnId\":\"" + done + "\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.dueDate").value(today))
                .andExpect(jsonPath("$.issue.closedAt").isNotEmpty());
        assertThat(jdbc.queryForObject(
                        "SELECT count(*) FROM activity_entry WHERE owner_id = ? AND field IN ('ASSIGNEE','START_DATE','DUE_DATE')",
                        Integer.class,
                        issue("SAFE", 1).toString()))
                .isEqualTo(3);

        // A plan somebody wrote stays: another's issue due far ahead keeps both when someone else moves it.
        create("둘");
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE/issues/2"))
                        .cookie(cookie(MEMBER))
                        .content(edit(0, "둘", todo, OTHER, "2099-01-01")))
                .andExpect(status().isNoContent());
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/2/move"))
                        .cookie(cookie(MEMBER))
                        .content("{\"columnId\":\"" + done + "\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/2").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.assigneeId").value(OTHER.toString()))
                .andExpect(jsonPath("$.issue.dueDate").value("2099-01-01"))
                .andExpect(jsonPath("$.issue.startDate").doesNotExist());

        // Made already under way (an agent recording what it is doing): filled as on a move.
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues"))
                        .cookie(cookie(MEMBER))
                        .content("{\"title\":\"셋\",\"columnId\":\"" + doing + "\"}"))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/3").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.assigneeId").value(MEMBER.toString()))
                .andExpect(jsonPath("$.issue.startDate").value(today))
                .andExpect(jsonPath("$.issue.startedAt").isNotEmpty());
    }

    @Test
    void anIssueKeepsItsEstimateStoryPointsAndTheTimeSpentOnIt() throws Exception {
        create("하나");
        UUID todo = column("SAFE", "할 일");
        // The plan: 2.5 hours and 3 points; points off the scale are refused.
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE/issues/1"))
                        .cookie(cookie(MEMBER))
                        .content("{\"expectedVersion\":0,\"title\":\"하나\",\"type\":\"TASK\",\"columnId\":\"" + todo
                                + "\",\"priority\":\"MEDIUM\",\"estimateHours\":2.5,\"storyPoints\":4}"))
                .andExpect(status().isBadRequest());
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE/issues/1"))
                        .cookie(cookie(MEMBER))
                        .content("{\"expectedVersion\":0,\"title\":\"하나\",\"type\":\"TASK\",\"columnId\":\"" + todo
                                + "\",\"priority\":\"MEDIUM\",\"estimateHours\":2.5,\"storyPoints\":3}"))
                .andExpect(status().isNoContent());
        // Time spent: the member's 1.5 hours yesterday and another's 45 minutes today.
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/1/time-entries"))
                        .cookie(cookie(MEMBER))
                        .content("{\"hours\":1.5,\"spentOn\":\""
                                + LocalDate.now().minusDays(1) + "\",\"note\":\"설계\"}"))
                .andExpect(status().isCreated());
        String other = mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/1/time-entries"))
                        .cookie(cookie(OTHER))
                        .content("{\"hours\":0.75}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/1/time-entries"))
                        .cookie(cookie(MEMBER))
                        .content("{\"hours\":25}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.estimateHours").value(2.5))
                .andExpect(jsonPath("$.issue.storyPoints").value(3.0))
                .andExpect(jsonPath("$.issue.spentHours").value(2.25));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1/time-entries").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.entries", hasSize(2)))
                .andExpect(jsonPath("$.entries[0].hours").value(0.75))
                .andExpect(jsonPath("$.entries[0].canDelete").value(false))
                .andExpect(jsonPath("$.entries[1].note").value("설계"))
                .andExpect(jsonPath("$.spentHours").value(2.25))
                .andExpect(jsonPath("$.estimateHours").value(2.5));
        // Only its writer or a Workspace administrator deletes an entry.
        mvc.perform(write(delete(other)).cookie(cookie(MEMBER))).andExpect(status().isForbidden());
        mvc.perform(write(delete(other)).cookie(cookie(ADMIN))).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.spentHours").value(1.5));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1/timeline").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[?(@.field == 'ESTIMATE')].after").value(contains("2.5")))
                .andExpect(jsonPath("$[?(@.field == 'STORY_POINTS')].after").value(contains("3")))
                .andExpect(jsonPath("$[?(@.field == 'TIME_SPENT')]", hasSize(3)));
    }

    @Test
    void cyclesHoldWorkItemsCountThemAndPassWhatIsLeftOn() throws Exception {
        LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Seoul"));
        String now = cycle("1주차", today.minusDays(3), today.plusDays(3));
        String next = cycle("2주차", today.plusDays(4), today.plusDays(10));
        // Days that overlap another cycle's are refused.
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/cycles"))
                        .cookie(cookie(MEMBER))
                        .content("{\"name\":\"겹침\",\"startDate\":\"" + today + "\",\"endDate\":\"" + today.plusDays(5)
                                + "\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ISSUE_CYCLE_OVERLAP"));
        // Two work items in the cycle under way, one done; 3 + 5 points.
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues"))
                        .cookie(cookie(MEMBER))
                        .content(
                                "{\"title\":\"하나\",\"cycleId\":\"" + now + "\",\"storyPoints\":3,\"estimateHours\":2}"))
                .andExpect(status().isCreated());
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues"))
                        .cookie(cookie(MEMBER))
                        .content("{\"title\":\"둘\",\"cycleId\":\"" + now + "\",\"storyPoints\":5}"))
                .andExpect(status().isCreated());
        create("셋");
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/1/move"))
                        .cookie(cookie(MEMBER))
                        .content("{\"columnId\":\"" + column("SAFE", "완료") + "\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues?cycle=current").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.items[*].title").value(containsInAnyOrder("하나", "둘")));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues?cycle=none").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.items[*].title").value(contains("셋")));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/2").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.cycleName").value("1주차"));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/cycles").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.cycles[0].state").value("CURRENT"))
                .andExpect(jsonPath("$.cycles[0].totals.workItems").value(2))
                .andExpect(jsonPath("$.cycles[0].totals.completed").value(1))
                .andExpect(jsonPath("$.cycles[0].totals.storyPoints").value(8.0))
                .andExpect(jsonPath("$.cycles[0].totals.completedStoryPoints").value(3.0))
                .andExpect(jsonPath("$.cycles[0].totals.estimateHours").value(2.0))
                .andExpect(jsonPath("$.cycles[1].state").value("UPCOMING"));
        // Finishing it passes the unfinished one on to the next cycle, on its timeline; the done one stays.
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/cycles/" + now + "/complete"))
                        .cookie(cookie(MEMBER))
                        .content("{\"expectedVersion\":0,\"moveTo\":\"" + next + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.moved").value(1));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/2").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.cycleName").value("2주차"));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.cycleName").value("1주차"));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/2/timeline").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[?(@.field == 'CYCLE')].after").value(contains("2주차")));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/cycles").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.cycles[0].state").value("COMPLETED"));
        // A finished cycle takes no more work items.
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE/issues/3"))
                        .cookie(cookie(MEMBER))
                        .content("{\"expectedVersion\":0,\"title\":\"셋\",\"type\":\"TASK\",\"columnId\":\""
                                + column("SAFE", "할 일") + "\",\"priority\":\"MEDIUM\",\"cycleId\":\"" + now + "\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ISSUE_CYCLE_COMPLETED"));
        // Deleting a cycle leaves its work items in none.
        mvc.perform(write(delete("/api/v1/workspace/projects/SAFE/cycles/" + next))
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/2").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.cycleId").doesNotExist());
    }

    @Test
    void cycleSettingsKeepCyclesRunningAndTakeWorkItemsThatGetUnderWay() throws Exception {
        LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Seoul"));
        // A cycle whose days are over, holding a work item not done.
        String old = cycle("지난 것", today.minusDays(20), today.minusDays(10));
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues"))
                        .cookie(cookie(MEMBER))
                        .content("{\"title\":\"남은 일\",\"cycleId\":\"" + old + "\"}"))
                .andExpect(status().isCreated());
        // Members do not run the cycles; administrators turn them on: one under way and two next, Monday to Sunday.
        String settings =
                "{\"isEnabled\":true,\"weeks\":1,\"startDay\":1,\"upcoming\":2,\"addsStarted\":true,\"addsCompleted\":true}";
        mvc.perform(write(put("/api/v1/workspace/projects/SAFE/cycles/settings"))
                        .cookie(cookie(MEMBER))
                        .content(settings))
                .andExpect(status().isForbidden());
        mvc.perform(write(put("/api/v1/workspace/projects/SAFE/cycles/settings"))
                        .cookie(cookie(ADMIN))
                        .content(settings))
                .andExpect(status().isNoContent());
        LocalDate monday = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        mvc.perform(get("/api/v1/workspace/projects/SAFE/cycles").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.settings.isEnabled").value(true))
                .andExpect(jsonPath("$.cycles", hasSize(4)))
                .andExpect(jsonPath("$.cycles[0].state").value("COMPLETED"))
                .andExpect(jsonPath("$.cycles[1].state").value("CURRENT"))
                .andExpect(jsonPath("$.cycles[1].startDate").value(monday.toString()))
                .andExpect(jsonPath("$.cycles[2].state").value("UPCOMING"))
                .andExpect(jsonPath("$.cycles[3].state").value("UPCOMING"));
        // What the finished cycle left went on to the one under way.
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.cycleName").value("사이클 2"));
        // A work item that gets under way joins the cycle under way.
        create("새 일");
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/2/move"))
                        .cookie(cookie(MEMBER))
                        .content("{\"columnId\":\"" + column("SAFE", "진행 중") + "\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/2").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.issue.cycleName").value("사이클 2"));
    }

    @Test
    void cyclesRunningOnAfterTheCurrentOneIsFinishedEarlyMakeNoMore() throws Exception {
        String settings =
                "{\"isEnabled\":true,\"weeks\":1,\"startDay\":1,\"upcoming\":2,\"addsStarted\":true,\"addsCompleted\":true}";
        mvc.perform(write(put("/api/v1/workspace/projects/SAFE/cycles/settings"))
                        .cookie(cookie(ADMIN))
                        .content(settings))
                .andExpect(status().isNoContent());
        String list = mvc.perform(get("/api/v1/workspace/projects/SAFE/cycles").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.cycles", hasSize(3)))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String current = com.jayway.jsonpath.JsonPath.read(list, "$.cycles[0].id");
        int version = com.jayway.jsonpath.JsonPath.read(list, "$.cycles[0].version");
        // The cycle under way is finished before its days are over: the days left of it are in no cycle, and the next
        // ones start after them, so no new cycle can be under way today.
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/cycles/" + current + "/complete"))
                        .cookie(cookie(MEMBER))
                        .content("{\"expectedVersion\":" + version + "}"))
                .andExpect(status().isOk());
        // Changing the start day then keeps the cycles there are rather than making them without end.
        mvc.perform(write(put("/api/v1/workspace/projects/SAFE/cycles/settings"))
                        .cookie(cookie(ADMIN))
                        .content(settings.replace("\"startDay\":1", "\"startDay\":3")))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/cycles").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.cycles", hasSize(3)))
                .andExpect(jsonPath("$.cycles[0].state").value("COMPLETED"))
                .andExpect(jsonPath("$.cycles[1].state").value("UPCOMING"))
                .andExpect(jsonPath("$.cycles[2].state").value("UPCOMING"));
    }

    @Test
    void projectRolesDecideWhoReadsCommentsWritesAndKeepsTheBoard() throws Exception {
        UUID viewer = id(4);
        UUID outsider = id(5);
        member(viewer, "라뷰어", "viewer@example.test");
        member(outsider, "마바깥", "outsider@example.test");
        ProjectMembers.join(jdbc, "SAFE", viewer, "VIEWER");
        create("로그인 오류");

        // Who is not a member does not find the project's issues, alone or across the area.
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(outsider)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/workspace/issues/SAFE-1").cookie(cookie(outsider)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/workspace/issues").cookie(cookie(outsider)))
                .andExpect(jsonPath("$.items", hasSize(0)));
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/1/comments"))
                        .cookie(cookie(outsider))
                        .content("{\"body\":\"댓글\"}"))
                .andExpect(status().isNotFound());

        // A viewer reads and comments, and writes nothing else.
        mvc.perform(get("/api/v1/workspace/projects/SAFE/issues/1").cookie(cookie(viewer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canWrite").value(false));
        mvc.perform(get("/api/v1/workspace/issues").cookie(cookie(viewer))).andExpect(jsonPath("$.items", hasSize(1)));
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues/1/comments"))
                        .cookie(cookie(viewer))
                        .content("{\"body\":\"확인했습니다\"}"))
                .andExpect(status().isCreated());
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/issues"))
                        .cookie(cookie(viewer))
                        .content("{\"title\":\"뷰어의 이슈\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(write(patch("/api/v1/workspace/projects/SAFE/issues/1"))
                        .cookie(cookie(viewer))
                        .content(edit(0, "바꿈", column("SAFE", "진행 중"), null, null)))
                .andExpect(status().isForbidden());

        // An editor writes issues but not the board; the project's administrator keeps the board and deletes any issue.
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/columns"))
                        .cookie(cookie(MEMBER))
                        .content("{\"name\":\"배포 대기\",\"category\":\"STARTED\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(write(delete("/api/v1/workspace/projects/SAFE/issues/1?expectedVersion=0"))
                        .cookie(cookie(OTHER)))
                .andExpect(status().isForbidden());
        ProjectMembers.join(jdbc, "SAFE", OTHER, "ADMIN");
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/columns"))
                        .cookie(cookie(OTHER))
                        .content("{\"name\":\"배포 대기\",\"category\":\"STARTED\"}"))
                .andExpect(status().isCreated());
        mvc.perform(write(delete("/api/v1/workspace/projects/SAFE/issues/1?expectedVersion=0"))
                        .cookie(cookie(OTHER)))
                .andExpect(status().isNoContent());
    }

    private String cycle(String name, LocalDate start, LocalDate end) throws Exception {
        String location = mvc.perform(write(post("/api/v1/workspace/projects/SAFE/cycles"))
                        .cookie(cookie(MEMBER))
                        .content("{\"name\":\"" + name + "\",\"startDate\":\"" + start + "\",\"endDate\":\"" + end
                                + "\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");
        String path = java.util.Objects.requireNonNull(location, "Location");
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private void create(String title) throws Exception {
        create(title, "SAFE");
    }

    private void create(String title, String key) throws Exception {
        mvc.perform(write(post("/api/v1/workspace/projects/" + key + "/issues"))
                        .cookie(cookie(MEMBER))
                        .content("{\"title\":\"" + title + "\"}"))
                .andExpect(status().isCreated());
    }

    private UUID issue(String key, long number) {
        return uuid(jdbc.queryForList(
                        "SELECT i.issue_id FROM issue i JOIN project_key k ON k.project_id = i.project_id"
                                + " WHERE k.prefix = ? AND i.number = ?",
                        String.class,
                        key,
                        number)
                .getFirst());
    }

    private UUID column(String key, String name) {
        return uuid(jdbc.queryForList(
                        "SELECT c.column_id FROM issue_column c JOIN project_key k ON k.project_id = c.project_id"
                                + " WHERE k.prefix = ? AND c.name = ?",
                        String.class,
                        key,
                        name)
                .getFirst());
    }

    private JsonNode state(String body) throws Exception {
        return JSON.readTree(mvc.perform(get(body).cookie(cookie(MEMBER)))
                .andReturn()
                .getResponse()
                .getContentAsString());
    }

    private static String edit(long version, String title, UUID column, UUID assignee, String due) {
        return "{\"expectedVersion\":" + version + ",\"title\":\"" + title + "\",\"type\":\"TASK\",\"columnId\":\""
                + column + "\",\"priority\":\"MEDIUM\""
                + (assignee == null ? "" : ",\"assigneeId\":\"" + assignee + "\"")
                + (due == null ? "" : ",\"dueDate\":\"" + LocalDate.parse(due) + "\"") + "}";
    }

    private static String save(long version, String text, boolean checkpoint) {
        return "{\"expectedVersion\":" + version
                + ",\"body\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\""
                + text + "\"}]}]},\"uploadIds\":[],\"checkpoint\":" + checkpoint
                + ",\"schemaVersion\":1}";
    }

    private void member(UUID id, String name, String email, Role... roles) {
        Accounts.upsert(jdbc, id, email, true, roles);
        Members.insert(jdbc, Members.member(id, name, email).hired(LocalDate.parse("2020-01-01")));
    }

    private Cookie cookie(UUID user) {
        return new Cookie("app_session", sessions.issue(user).token());
    }

    private static UUID uuid(String value) {
        return UUID.fromString(value);
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

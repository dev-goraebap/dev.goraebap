package xyz.goraebap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
import tools.jackson.databind.json.JsonMapper;
import xyz.goraebap.foundation.user.application.auth.SessionService;
import xyz.goraebap.productivity.document.application.document.DocumentService;
import xyz.goraebap.productivity.document.application.folder.FolderService;
import xyz.goraebap.shared.web.Role;
import xyz.goraebap.support.Accounts;
import xyz.goraebap.support.Members;
import xyz.goraebap.support.ProjectMembers;
import xyz.goraebap.support.StoredFiles;
import xyz.goraebap.support.TestDatabase;

/**
 * Documents on BIT's 문서함: the shared space (공용) and each project's, folders nested in a space and documents in them;
 * any member writes where the space allows (an archived project's are read only, a deleted project's gone) and its
 * maker or a Workspace administrator deletes. A document starts empty, from the editor's JSON or from Markdown, its body
 * saved over its version as an issue's; its words are searched with the title.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class DocumentsTest {
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

    @Autowired
    DocumentService documentService;

    @Autowired
    FolderService folderService;

    @BeforeEach
    void prepare() throws Exception {
        TestDatabase.clear(jdbc);
        member(ADMIN, "가관리", "admin@example.test", Role.WORKSPACE_ADMIN);
        member(MEMBER, "나구성원", "member@example.test");
        member(OTHER, "다동료", "other@example.test");
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(ADMIN))
                        .content("{\"key\":\"SAFE\",\"name\":\"안전플랫폼\"}"))
                .andExpect(status().isCreated());
        ProjectMembers.editors(jdbc, "SAFE", MEMBER, OTHER);
    }

    @Test
    void aNewDocumentBindsItsFirstBodyUploadsAtomically() throws Exception {
        String upload = upload(MEMBER);
        UUID doc = created(JSON.writeValueAsString(Map.of(
                "projectKey", "SAFE", "title", "처음부터 첨부한 문서", "body", fileBody(upload), "uploadIds", List.of(upload))));
        mvc.perform(get("/api/v1/workspace/documents/" + doc + "/body").cookie(cookie(OTHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.body.content[0].attrs.src").value("attachment:" + upload));
        mvc.perform(get("/api/v1/workspace/documents/" + doc + "/files/" + upload)
                        .cookie(cookie(OTHER)))
                .andExpect(status().isFound());
        assertThat(jdbc.queryForObject(
                        "SELECT owner_id FROM attachment WHERE attachment_id = ? AND owner_type = 'PROJECT_DOCUMENT'",
                        String.class,
                        upload))
                .isEqualTo(doc.toString());
        assertThat(jdbc.queryForObject(
                        "SELECT COUNT(*) FROM pending_upload WHERE pending_upload_id = ?", Integer.class, upload))
                .isZero();
    }

    @Test
    void anotherMembersUploadCannotLeaveAPartiallyCreatedDocumentOrLabelAssignment() throws Exception {
        String upload = upload(OTHER);
        UUID label = UUID.randomUUID();
        jdbc.update(
                "INSERT INTO document_label(label_id,name,color) VALUES (?,?,?)", label.toString(), "첨부 검증", "#498fdf");
        int documents = count("document");
        int bodies = count("rich_body");
        int assignments = count("document_label_link");
        mvc.perform(write(post("/api/v1/workspace/documents"))
                        .cookie(cookie(MEMBER))
                        .content(JSON.writeValueAsString(Map.of(
                                "projectKey",
                                "SAFE",
                                "title",
                                "실패하면 남지 않는 문서",
                                "labelIds",
                                List.of(label),
                                "body",
                                fileBody(upload),
                                "uploadIds",
                                List.of(upload)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("FILE_UPLOAD_MISSING"));
        assertThat(count("document")).isEqualTo(documents);
        assertThat(count("rich_body")).isEqualTo(bodies);
        assertThat(count("document_label_link")).isEqualTo(assignments);
        assertThat(jdbc.queryForObject(
                        "SELECT COUNT(*) FROM attachment WHERE attachment_id = ?", Integer.class, upload))
                .isZero();
        assertThat(jdbc.queryForObject(
                        "SELECT COUNT(*) FROM pending_upload WHERE pending_upload_id = ?", Integer.class, upload))
                .isEqualTo(1);
    }

    @Test
    void uploadsWithoutABodyAreRejectedWithoutConsumingTheUpload() throws Exception {
        String upload = upload(MEMBER);
        int documents = count("document");
        mvc.perform(write(post("/api/v1/workspace/documents"))
                        .cookie(cookie(MEMBER))
                        .content(JSON.writeValueAsString(
                                Map.of("projectKey", "SAFE", "title", "본문 없는 첨부", "uploadIds", List.of(upload)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("DOCUMENT_BODY_INVALID"));
        assertThat(count("document")).isEqualTo(documents);
        // A rejected creation leaves the ticket usable by a corrected request.
        UUID doc = created(JSON.writeValueAsString(Map.of(
                "projectKey", "SAFE", "title", "본문을 채운 재시도", "body", fileBody(upload), "uploadIds", List.of(upload))));
        mvc.perform(get("/api/v1/workspace/documents/" + doc + "/files/" + upload)
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isFound());
    }

    @Test
    void aBodyCannotReferenceAnUploadMissingFromTheCreationRequest() throws Exception {
        String upload = upload(MEMBER);
        int documents = count("document");
        mvc.perform(write(post("/api/v1/workspace/documents"))
                        .cookie(cookie(MEMBER))
                        .content(JSON.writeValueAsString(
                                Map.of("projectKey", "SAFE", "title", "미등록 첨부", "body", fileBody(upload)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("RICH_BODY_FILE_UNKNOWN"));
        assertThat(count("document")).isEqualTo(documents);
        assertThat(jdbc.queryForObject(
                        "SELECT COUNT(*) FROM pending_upload WHERE pending_upload_id = ?", Integer.class, upload))
                .isEqualTo(1);
    }

    @Test
    void projectRolesDecideWhoReadsCommentsWritesAndDeletesDocuments() throws Exception {
        UUID viewer = id(4);
        UUID outsider = id(5);
        member(viewer, "라뷰어", "viewer@example.test");
        member(outsider, "마바깥", "outsider@example.test");
        ProjectMembers.join(jdbc, "SAFE", viewer, "VIEWER");
        UUID page = create(null, null, "설계");

        // Who is not a member finds neither the document nor it in a list.
        mvc.perform(get("/api/v1/workspace/documents/" + page).cookie(cookie(outsider)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/workspace/documents").cookie(cookie(outsider)))
                .andExpect(jsonPath("$.items", hasSize(0)));
        mvc.perform(get("/api/v1/workspace/documents?project=SAFE").cookie(cookie(outsider)))
                .andExpect(status().isNotFound());

        // A viewer reads and comments, and writes nothing else.
        mvc.perform(get("/api/v1/workspace/documents/" + page).cookie(cookie(viewer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canWrite").value(false))
                .andExpect(jsonPath("$.canDelete").value(false));
        mvc.perform(write(post("/api/v1/workspace/documents/" + page + "/comments"))
                        .cookie(cookie(viewer))
                        .content("{\"body\":\"읽었습니다\"}"))
                .andExpect(status().isCreated());
        mvc.perform(write(post("/api/v1/workspace/documents"))
                        .cookie(cookie(viewer))
                        .content("{\"projectKey\":\"SAFE\",\"title\":\"뷰어의 문서\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(write(put("/api/v1/workspace/documents/" + page + "/body"))
                        .cookie(cookie(viewer))
                        .content(save(1, "바꿈", false)))
                .andExpect(status().isForbidden());

        // An editor does not delete another's document; the project's administrator does.
        mvc.perform(write(delete("/api/v1/workspace/documents/" + page + "?expectedVersion=0"))
                        .cookie(cookie(OTHER)))
                .andExpect(status().isForbidden());
        ProjectMembers.join(jdbc, "SAFE", OTHER, "ADMIN");
        mvc.perform(get("/api/v1/workspace/documents/" + page).cookie(cookie(OTHER)))
                .andExpect(jsonPath("$.canDelete").value(true))
                .andExpect(jsonPath("$.canManage").value(true));
        mvc.perform(write(delete("/api/v1/workspace/documents/" + page + "?expectedVersion=0"))
                        .cookie(cookie(OTHER)))
                .andExpect(status().isNoContent());
    }

    private int count(String table) {
        return Objects.requireNonNull(jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class));
    }

    private Map<String, Object> fileBody(String upload) {
        return Map.of(
                "type",
                "doc",
                "content",
                List.of(Map.of(
                        "type",
                        "media",
                        "attrs",
                        Map.of(
                                "blockId",
                                UUID.randomUUID().toString(),
                                "src",
                                "attachment:" + upload,
                                "name",
                                "guide.pdf",
                                "mime",
                                "application/pdf",
                                "width",
                                100))));
    }

    private String upload(UUID user) throws Exception {
        byte[] content = "%PDF-1.7\n%%EOF\n".getBytes(StandardCharsets.US_ASCII);
        var result = mvc.perform(write(post("/api/v1/files/uploads"))
                        .cookie(cookie(user))
                        .content(JSON.writeValueAsString(Map.of("filename", "guide.pdf", "size", content.length))))
                .andExpect(status().isCreated())
                .andReturn();
        var ticket = JSON.readTree(result.getResponse().getContentAsString());
        assertThat(StoredFiles.send(mvc, ticket, content)).isEqualTo(200);
        return ticket.get("id").asString();
    }

    @Test
    void aDocumentStartsFromMarkdownOrJsonAndItsBodySavesOverItsVersion() throws Exception {
        UUID imported = createMarkdown(null, "가져온 문서", "## 맥락\n\n- [x] 정함\n\n> [!NOTE]\n> 참고할 것");
        String body = "/api/v1/workspace/documents/" + imported + "/body";
        mvc.perform(get(body).cookie(cookie(OTHER)))
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.body.content[0].type").value("heading"))
                .andExpect(jsonPath("$.body.content[1].type").value("taskList"))
                .andExpect(jsonPath("$.body.content[2].type").value("callout"));
        mvc.perform(write(post("/api/v1/workspace/documents"))
                        .cookie(cookie(MEMBER))
                        .content("{\"title\":\"둘 다\",\"markdown\":\"# 하나\",\"body\":{\"type\":\"doc\"}}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("DOCUMENT_BODY_INVALID"));

        UUID empty = create(null, null, "빈 문서");
        String emptyBody = "/api/v1/workspace/documents/" + empty + "/body";
        mvc.perform(get(emptyBody).cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.version").value(0))
                .andExpect(jsonPath("$.body").value(nullValue()));
        mvc.perform(write(put(emptyBody)).cookie(cookie(OTHER)).content(save(0, "처음 쓴 문장", true)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1));
        mvc.perform(write(put(emptyBody)).cookie(cookie(MEMBER)).content(save(0, "늦은 글", false)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("RICH_BODY_VERSION_CONFLICT"));
        // The saved words are searched, and the document reads as written by whoever saved it.
        mvc.perform(get("/api/v1/workspace/documents?q=처음 쓴").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.items[*].id").value(contains(empty.toString())))
                .andExpect(jsonPath("$.items[0].updatedByName").value("다동료"))
                .andExpect(jsonPath("$.items[0].version").value(0));
        // The document's timeline: the save of its body, then a comment quoting it; its writer edits it, then deletes
        // it.
        String document = "/api/v1/workspace/documents/" + empty;
        String comment = mvc.perform(write(post(document + "/comments"))
                        .cookie(cookie(MEMBER))
                        .content("{\"body\":\"좋아요\",\"quote\":\"처음\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");
        mvc.perform(get(document + "/timeline").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[*].kind").value(contains("EVENT", "COMMENT")))
                .andExpect(jsonPath("$[0].field").value("BODY"))
                .andExpect(jsonPath("$[1].actorName").value("나구성원"))
                .andExpect(jsonPath("$[1].quote").value("처음"));
        // A reply answers the comment; a reply to the reply answers the same comment (one level).
        String parent = java.util.Objects.requireNonNull(comment).substring(comment.lastIndexOf('/') + 1);
        String reply = java.util.Objects.requireNonNull(mvc.perform(write(post(document + "/comments"))
                        .cookie(cookie(OTHER))
                        .content("{\"body\":\"동의합니다\",\"parentId\":\"" + parent + "\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        mvc.perform(write(post(document + "/comments"))
                        .cookie(cookie(MEMBER))
                        .content("{\"body\":\"감사합니다\",\"parentId\":\"" + reply.substring(reply.lastIndexOf('/') + 1)
                                + "\"}"))
                .andExpect(status().isCreated());
        mvc.perform(get(document + "/timeline").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[2].parentId").value(parent))
                .andExpect(jsonPath("$[3].parentId").value(parent));
        mvc.perform(write(delete(reply)).cookie(cookie(OTHER))).andExpect(status().isNoContent());
        mvc.perform(get(document + "/timeline").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[2].body").value("감사합니다"));
        String last = mvc.perform(get(document + "/timeline").cookie(cookie(MEMBER)))
                .andReturn()
                .getResponse()
                .getContentAsString();
        mvc.perform(write(delete(document + "/comments/" + com.jayway.jsonpath.JsonPath.read(last, "$[2].id")))
                        .cookie(cookie(MEMBER)))
                .andExpect(status().isNoContent());
        mvc.perform(write(patch(comment)).cookie(cookie(OTHER)).content("{\"body\":\"남의 댓글\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(write(patch(comment)).cookie(cookie(MEMBER)).content("{\"body\":\"아주 좋아요\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(write(delete(comment)).cookie(cookie(MEMBER))).andExpect(status().isNoContent());
        mvc.perform(get(document + "/timeline").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[4].field").value("COMMENT_DELETED"));
    }

    @Test
    void commentsSitOnBlocksRepliesFollowAndThreadsResolve() throws Exception {
        UUID doc = create(null, null, "블록 댓글");
        String base = "/api/v1/workspace/documents/" + doc;
        String first = Objects.requireNonNull(mvc.perform(write(post(base + "/comments"))
                        .cookie(cookie(MEMBER))
                        .content("{\"body\":\"이 문단 다시 보기\",\"quote\":\"처음 문단\",\"blockId\":\"block-1\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        String thread = first.substring(first.lastIndexOf('/') + 1);
        mvc.perform(write(post(base + "/comments"))
                        .cookie(cookie(OTHER))
                        .content("{\"body\":\"고쳤습니다\",\"parentId\":\"" + thread + "\",\"blockId\":\"other\"}"))
                .andExpect(status().isCreated());
        mvc.perform(get(base + "/timeline").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[0].blockId").value("block-1"))
                .andExpect(jsonPath("$[0].quote").value("처음 문단"))
                .andExpect(jsonPath("$[0].resolvedAt").value(nullValue()))
                .andExpect(jsonPath("$[1].parentId").value(thread))
                .andExpect(jsonPath("$[1].blockId").value(nullValue()));
        // The thread resolves (an event says so) and opens again; a reply has no thread to resolve.
        mvc.perform(write(put(base + "/comments/" + thread + "/resolution"))
                        .cookie(cookie(OTHER))
                        .content("{\"resolved\":true}"))
                .andExpect(status().isNoContent());
        mvc.perform(get(base + "/timeline").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[0].resolvedAt").isNotEmpty())
                .andExpect(jsonPath("$[0].resolvedByName").value("다동료"))
                .andExpect(jsonPath("$[2].field").value("COMMENT_RESOLVED"));
        String timeline = mvc.perform(get(base + "/timeline").cookie(cookie(MEMBER)))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String reply = com.jayway.jsonpath.JsonPath.read(timeline, "$[1].id");
        mvc.perform(write(put(base + "/comments/" + reply + "/resolution"))
                        .cookie(cookie(MEMBER))
                        .content("{\"resolved\":true}"))
                .andExpect(status().isNotFound());
        mvc.perform(write(put(base + "/comments/" + thread + "/resolution"))
                        .cookie(cookie(MEMBER))
                        .content("{\"resolved\":false}"))
                .andExpect(status().isNoContent());
        mvc.perform(get(base + "/timeline").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$[0].resolvedAt").value(nullValue()))
                .andExpect(jsonPath("$[3].field").value("COMMENT_REOPENED"));
    }

    @Test
    void blocksSaveApartAndOnlyTheSameBlockConflicts() throws Exception {
        UUID doc = create(null, null, "블록 문서");
        String body = "/api/v1/workspace/documents/" + doc + "/body";
        mvc.perform(write(put(body))
                        .cookie(cookie(MEMBER))
                        .content("{\"expectedVersion\":0,\"body\":{\"type\":\"doc\",\"content\":["
                                + paragraph("a", "하나") + "," + paragraph("b", "둘") + "," + paragraph("c", "셋")
                                + "]},\"uploadIds\":[],\"checkpoint\":false,\"schemaVersion\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.blocks.a").value(1));
        // One window writes a and adds n after it; another, still at version 1 of every block, writes c.
        mvc.perform(write(patch(body))
                        .cookie(cookie(MEMBER))
                        .content("{\"order\":[\"a\",\"n\",\"b\",\"c\"],\"puts\":[{\"blockId\":\"a\",\"node\":"
                                + paragraph("a", "하나!") + ",\"expectedVersion\":1},{\"blockId\":\"n\",\"node\":"
                                + paragraph("n", "새 블록") + "}],\"deletes\":[],\"uploadIds\":[],\"checkpoint\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(2))
                .andExpect(jsonPath("$.blocks.a").value(2))
                .andExpect(jsonPath("$.blocks.b").value(1));
        mvc.perform(write(patch(body))
                        .cookie(cookie(OTHER))
                        .content("{\"order\":[\"a\",\"c\",\"b\"],\"puts\":[{\"blockId\":\"c\",\"node\":"
                                + paragraph("c", "셋!") + ",\"expectedVersion\":1}],\"deletes\":[{\"blockId\":\"b\","
                                + "\"expectedVersion\":1}],\"uploadIds\":[],\"checkpoint\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(3))
                .andExpect(jsonPath("$.body.content[*].attrs.blockId").value(contains("a", "n", "c")))
                .andExpect(jsonPath("$.body.content[0].content[0].text").value("하나!"))
                .andExpect(jsonPath("$.body.content[2].content[0].text").value("셋!"));
        // A block changed since it was read refuses the save, and nothing of it is written.
        mvc.perform(write(patch(body))
                        .cookie(cookie(OTHER))
                        .content("{\"order\":[\"a\",\"n\",\"c\"],\"puts\":[{\"blockId\":\"a\",\"node\":"
                                + paragraph("a", "늦은 글") + ",\"expectedVersion\":1},{\"blockId\":\"n\",\"node\":"
                                + paragraph("n", "같이 쓴 글") + ",\"expectedVersion\":2}],\"deletes\":[],\"uploadIds\":[],"
                                + "\"checkpoint\":false}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("RICH_BODY_BLOCK_CONFLICT"));
        mvc.perform(get(body).cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.version").value(3))
                .andExpect(jsonPath("$.body.content[1].content[0].text").value("새 블록"));
        // The body as kept is its blocks in order; a whole save over it still works, and a restore too.
        assertThat(jdbc.queryForList(
                        "SELECT block_id FROM rich_block WHERE owner_id=? ORDER BY position", String.class, doc))
                .containsExactly("a", "n", "c");
        mvc.perform(write(put(body)).cookie(cookie(MEMBER)).content(save(3, "통째로", true)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(4));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM rich_block WHERE owner_id=?", Integer.class, doc))
                .isEqualTo(1);
        mvc.perform(get("/api/v1/workspace/documents?q=통째로").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.items[*].id").value(contains(doc.toString())));
        String versions = mvc.perform(get(body).cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.versions[0].body").value(nullValue()))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String older = com.jayway.jsonpath.JsonPath.read(versions, "$.versions[-1].id");
        mvc.perform(get(body + "/versions/" + older).cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.body.type").value("doc"));
        mvc.perform(write(post(body + "/revisions/" + older + "/restore"))
                        .cookie(cookie(MEMBER))
                        .content("{\"expectedVersion\":4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(5));
        assertThat(jdbc.queryForObject("SELECT body FROM rich_body WHERE owner_id=?", String.class, doc))
                .isEqualTo(jdbc.queryForObject(
                        "SELECT '{\"content\":[' || group_concat(node, ',') || '],\"type\":\"doc\"}' FROM"
                                + " (SELECT node FROM rich_block WHERE owner_id=? ORDER BY position)",
                        String.class,
                        doc));
    }

    private static String paragraph(String id, String text) {
        return "{\"type\":\"paragraph\",\"attrs\":{\"blockId\":\"" + id
                + "\"},\"content\":[{\"type\":\"text\",\"text\":\"" + text + "\"}]}";
    }

    @Test
    void editingLeasesExpireWithoutLockingOrRemovingAnotherWindowsLease() throws Exception {
        UUID doc = create(null, null, "함께 편집");
        String base = "/api/v1/workspace/documents/" + doc + "/body/editing";
        UUID first = UUID.randomUUID();
        UUID second = UUID.randomUUID();
        mvc.perform(write(put(base + "/" + first)).cookie(cookie(MEMBER))).andExpect(status().isNoContent());
        mvc.perform(write(put(base + "/" + second)).cookie(cookie(MEMBER))).andExpect(status().isNoContent());
        mvc.perform(get(base).cookie(cookie(OTHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("나구성원"));
        mvc.perform(write(delete(base + "/" + first)).cookie(cookie(OTHER))).andExpect(status().isNoContent());
        mvc.perform(get(base).cookie(cookie(OTHER))).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(write(delete(base + "/" + first)).cookie(cookie(MEMBER))).andExpect(status().isNoContent());
        mvc.perform(get(base).cookie(cookie(OTHER))).andExpect(jsonPath("$", hasSize(1)));
        // Independent heartbeat from the remaining window still stands; it is not an edit lock.
        mvc.perform(write(put(base + "/" + second)).cookie(cookie(MEMBER))).andExpect(status().isNoContent());
        jdbc.update(
                "UPDATE document_editing SET last_seen_at=?",
                xyz.goraebap.shared.persistence.InstantTextBinding.text(
                        java.time.Instant.now().minusSeconds(91)));
        mvc.perform(get(base).cookie(cookie(OTHER))).andExpect(jsonPath("$", hasSize(0)));
        // A restricted document reveals neither presence nor permission to announce an editor.
        grant("documents", doc, MEMBER, "[{\"subject\":\"OWNER\",\"level\":\"MANAGE\"}]")
                .andExpect(status().isNoContent());
        mvc.perform(get(base).cookie(cookie(OTHER))).andExpect(status().isNotFound());
        mvc.perform(write(put(base + "/" + UUID.randomUUID())).cookie(cookie(OTHER)))
                .andExpect(status().isNotFound());
        mvc.perform(write(put(base + "/" + UUID.randomUUID())).cookie(cookie(MEMBER)))
                .andExpect(status().isNoContent());
    }

    @Test
    void libraryKeepsQueriesAndReadingTreesSeparateAndChecksVersionsAndScope() throws Exception {
        UUID doc = create("SAFE", null, "Introduction");
        String base = "/api/v1/workspace/projects/SAFE/document-library";
        String labelLocation = mvc.perform(write(post("/api/v1/workspace/document-labels"))
                        .cookie(cookie(ADMIN))
                        .content("{\"name\":\"Guide\",\"color\":\"#4a90e2\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");
        Objects.requireNonNull(labelLocation);
        String label = labelLocation.substring(labelLocation.lastIndexOf('/') + 1);
        mvc.perform(write(put(base + "/documents/" + doc + "/labels"))
                        .cookie(cookie(MEMBER))
                        .content("{\"expectedVersion\":0,\"ids\":[\"" + label + "\"]}"))
                .andExpect(status().isNoContent());
        mvc.perform(write(put(base + "/documents/" + doc + "/labels"))
                        .cookie(cookie(MEMBER))
                        .content("{\"expectedVersion\":0,\"ids\":[]}"))
                .andExpect(status().isConflict());
        String view = "{\"name\":\"Guides\",\"labels\":[\"" + label
                + "\"],\"layout\":\"GRID\",\"sort\":\"CUSTOM\",\"icon\":\"book\",\"color\":\"#4a90e2\"}";
        mvc.perform(write(post(base + "/views")).cookie(cookie(MEMBER)).content(view))
                .andExpect(status().isForbidden());
        mvc.perform(write(post(base + "/views")).cookie(cookie(ADMIN)).content(view))
                .andExpect(status().isCreated());
        mvc.perform(get(base).cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pages", hasSize(1)))
                .andExpect(jsonPath("$.views[0].layout").value("GRID"))
                .andExpect(jsonPath("$.views[0].icon").value("book"))
                .andExpect(jsonPath("$.views[0].color").value("#4a90e2"));
        mvc.perform(get("/api/v1/workspace/documents/" + doc).cookie(cookie(MEMBER)))
                .andExpect(status().isOk());
        mvc.perform(write(put(base + "/order"))
                        .cookie(cookie(MEMBER))
                        .content("{\"expectedVersion\":0,\"ids\":[\"" + doc + "\"]}"))
                .andExpect(status().isForbidden());
        mvc.perform(write(put(base + "/order"))
                        .cookie(cookie(ADMIN))
                        .content("{\"expectedVersion\":0,\"ids\":[\"" + doc + "\"]}"))
                .andExpect(status().isNoContent());
        mvc.perform(write(put(base + "/order"))
                        .cookie(cookie(ADMIN))
                        .content("{\"expectedVersion\":0,\"ids\":[\"" + doc + "\"]}"))
                .andExpect(status().isConflict());
        mvc.perform(write(post("/api/v1/workspace/documents"))
                        .cookie(cookie(MEMBER))
                        .content("{\"title\":\"Shared\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(write(post("/api/v1/workspace/documents"))
                        .cookie(cookie(MEMBER))
                        .content("{\"projectKey\":\"SAFE\",\"kind\":\"MANUAL\",\"title\":\"Old kind\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(write(post("/api/v1/workspace/document-folders"))
                        .cookie(cookie(MEMBER))
                        .content("{\"projectKey\":\"SAFE\",\"name\":\"Folder\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void subpagesInheritAccessHaveNoLabelsAndRejectCyclesAndForeignParents() throws Exception {
        UUID root = create("SAFE", null, "Guide");
        grant("documents", root, MEMBER, "[{\"subject\":\"OWNER\",\"level\":\"MANAGE\"}]")
                .andExpect(status().isNoContent());
        var created = mvc.perform(write(post("/api/v1/workspace/documents"))
                        .cookie(cookie(MEMBER))
                        .content("{\"projectKey\":\"SAFE\",\"title\":\"Child\",\"parentId\":\"" + root + "\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");
        Objects.requireNonNull(created);
        var child = UUID.fromString(created.substring(created.lastIndexOf('/') + 1));
        String base = "/api/v1/workspace/projects/SAFE/document-library";
        mvc.perform(get(base).cookie(cookie(OTHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pages", hasSize(0)));
        mvc.perform(get(created).cookie(cookie(OTHER))).andExpect(status().isNotFound());
        mvc.perform(get(created + "/body").cookie(cookie(OTHER))).andExpect(status().isNotFound());
        mvc.perform(write(post("/api/v1/workspace/documents"))
                        .cookie(cookie(OTHER))
                        .content("{\"projectKey\":\"SAFE\",\"title\":\"Forbidden child\",\"parentId\":\"" + root
                                + "\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(write(put(base + "/documents/" + child + "/labels"))
                        .cookie(cookie(MEMBER))
                        .content("{\"expectedVersion\":0,\"ids\":[]}"))
                .andExpect(status().isBadRequest());
        mvc.perform(write(put(base + "/documents/" + root + "/parent"))
                        .cookie(cookie(ADMIN))
                        .content("{\"expectedVersion\":0,\"parentId\":\"" + child + "\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(write(post("/api/v1/workspace/projects"))
                        .cookie(cookie(ADMIN))
                        .content("{\"key\":\"FOREIGN\",\"name\":\"다른 프로젝트\"}"))
                .andExpect(status().isCreated());
        ProjectMembers.editors(jdbc, "FOREIGN", MEMBER);
        UUID foreign = create("FOREIGN", null, "Other project");
        mvc.perform(write(put(base + "/documents/" + child + "/parent"))
                        .cookie(cookie(ADMIN))
                        .content("{\"expectedVersion\":0,\"parentId\":\"" + foreign + "\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(write(put(base + "/order"))
                        .cookie(cookie(ADMIN))
                        .content("{\"expectedVersion\":0,\"parentId\":\"" + root + "\",\"ids\":[\"" + child + "\"]}"))
                .andExpect(status().isNoContent());
        mvc.perform(write(put(base + "/order"))
                        .cookie(cookie(ADMIN))
                        .content("{\"expectedVersion\":1,\"parentId\":\"" + root + "\",\"ids\":[\"" + root + "\"]}"))
                .andExpect(status().isBadRequest());
        mvc.perform(write(delete("/api/v1/workspace/documents/" + root + "?expectedVersion=0"))
                        .cookie(cookie(ADMIN)))
                .andExpect(status().isNoContent());
        mvc.perform(get(created).cookie(cookie(ADMIN))).andExpect(status().isNotFound());
    }

    @Test
    void documentLabelsAreWorkspaceWideSeparateFromWorkLabelsAndVersioned() throws Exception {
        var workLocation = Objects.requireNonNull(mvc.perform(write(post("/api/v1/workspace/work-item-labels"))
                        .cookie(cookie(ADMIN))
                        .content("{\"name\":\"분류\",\"color\":\"#eb5757\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        mvc.perform(write(post("/api/v1/workspace/document-labels"))
                        .cookie(cookie(MEMBER))
                        .content("{\"name\":\"분류\",\"color\":\"#4a90e2\"}"))
                .andExpect(status().isForbidden());
        var location = Objects.requireNonNull(mvc.perform(write(post("/api/v1/workspace/document-labels"))
                        .cookie(cookie(ADMIN))
                        .content("{\"name\":\"분류\",\"color\":\"#4a90e2\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        var label = location.substring(location.lastIndexOf('/') + 1);
        mvc.perform(get("/api/v1/workspace/document-labels").cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].color").value("#4a90e2"));
        mvc.perform(write(post("/api/v1/workspace/document-labels"))
                        .cookie(cookie(ADMIN))
                        .content("{\"name\":\"분류\",\"color\":\"#4cb782\"}"))
                .andExpect(status().isConflict());
        var docLocation = Objects.requireNonNull(mvc.perform(write(post("/api/v1/workspace/documents"))
                        .cookie(cookie(MEMBER))
                        .content("{\"projectKey\":\"SAFE\",\"title\":\"라벨과 함께 생성\",\"labelIds\":[\"" + label + "\"]}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        var doc = docLocation.substring(docLocation.lastIndexOf('/') + 1);
        var workLabel = workLocation.substring(workLocation.lastIndexOf('/') + 1);
        mvc.perform(write(post("/api/v1/workspace/documents"))
                        .cookie(cookie(MEMBER))
                        .content("{\"projectKey\":\"SAFE\",\"title\":\"잘못된 분류\",\"labelIds\":[\"" + workLabel + "\"]}"))
                .andExpect(status().isBadRequest());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM document WHERE title='잘못된 분류'", Integer.class))
                .isZero();
        mvc.perform(write(patch(location))
                        .cookie(cookie(ADMIN))
                        .content("{\"expectedVersion\":0,\"name\":\"분류\",\"color\":\"#4cb782\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(write(patch(location))
                        .cookie(cookie(ADMIN))
                        .content("{\"expectedVersion\":0,\"name\":\"낡은 수정\",\"color\":\"#4cb782\"}"))
                .andExpect(status().isConflict());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/document-library").cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignments['" + doc + "'][0]").value(label));
        mvc.perform(write(post("/api/v1/workspace/projects/SAFE/document-library/views"))
                        .cookie(cookie(ADMIN))
                        .content("{\"name\":\"분류 뷰\",\"labels\":[\"" + label
                                + "\"],\"layout\":\"GRID\",\"sort\":\"CUSTOM\"}"))
                .andExpect(status().isCreated());
        mvc.perform(write(delete(location + "?expectedVersion=1")).cookie(cookie(ADMIN)))
                .andExpect(status().isNoContent());
        mvc.perform(get(docLocation).cookie(cookie(MEMBER))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/document-library").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.views[0].labels", hasSize(0)));
        mvc.perform(get("/api/v1/workspace/work-item-labels").cookie(cookie(MEMBER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].color").value("#eb5757"));
    }

    @Test
    void documentViewsKeepTheOrderTheyArePutIn() throws Exception {
        var ids = new java.util.ArrayList<String>();
        for (var name : List.of("가", "나", "다")) {
            var location = Objects.requireNonNull(
                    mvc.perform(write(post("/api/v1/workspace/projects/SAFE/document-library/views"))
                                    .cookie(cookie(ADMIN))
                                    .content("{\"name\":\"" + name
                                            + "\",\"labels\":[],\"layout\":\"GRID\",\"sort\":\"CUSTOM\"}"))
                            .andExpect(status().isCreated())
                            .andReturn()
                            .getResponse()
                            .getHeader("Location"));
            ids.add(location.substring(location.lastIndexOf('/') + 1));
        }
        mvc.perform(get("/api/v1/workspace/projects/SAFE/document-library").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.views[*].name", contains("가", "나", "다")));
        var order = "{\"ids\":[\"" + ids.get(2) + "\",\"" + ids.get(0) + "\",\"" + ids.get(1) + "\"]}";
        mvc.perform(write(put("/api/v1/workspace/projects/SAFE/document-library/views/order"))
                        .cookie(cookie(MEMBER))
                        .content(order))
                .andExpect(status().isForbidden());
        mvc.perform(write(put("/api/v1/workspace/projects/SAFE/document-library/views/order"))
                        .cookie(cookie(ADMIN))
                        .content("{\"ids\":[\"" + ids.get(0) + "\"]}"))
                .andExpect(status().isBadRequest());
        mvc.perform(write(put("/api/v1/workspace/projects/SAFE/document-library/views/order"))
                        .cookie(cookie(ADMIN))
                        .content(order))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/projects/SAFE/document-library").cookie(cookie(MEMBER)))
                .andExpect(jsonPath("$.views[*].name", contains("다", "가", "나")));
    }

    private UUID folder(String key, UUID parent, String name) throws Exception {
        String location = mvc.perform(write(post("/api/v1/workspace/document-folders"))
                        .cookie(cookie(MEMBER))
                        .content("{" + ("\"projectKey\":\"" + key + "\",")
                                + (parent == null ? "" : "\"parentId\":\"" + parent + "\",") + "\"name\":\"" + name
                                + "\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");
        String path = Objects.requireNonNull(location, "Location");
        return UUID.fromString(path.substring(path.lastIndexOf('/') + 1));
    }

    private org.springframework.test.web.servlet.ResultActions grant(String items, UUID id, UUID by, String grants)
            throws Exception {
        return mvc.perform(write(put("/api/v1/workspace/" + items + "/" + id + "/access"))
                .cookie(cookie(by))
                .content("{\"grants\":" + grants + "}"));
    }

    private UUID chapter(UUID manual, UUID parent, String title) throws Exception {
        String location = mvc.perform(write(post("/api/v1/workspace/documents/" + manual + "/chapters"))
                        .cookie(cookie(MEMBER))
                        .content("{" + (parent == null ? "" : "\"parentId\":\"" + parent + "\",") + "\"title\":\""
                                + title + "\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");
        String path = Objects.requireNonNull(location, "Location");
        return UUID.fromString(path.substring(path.lastIndexOf('/') + 1));
    }

    private org.springframework.test.web.servlet.ResultActions move(UUID chapter, long version, UUID parent, int index)
            throws Exception {
        return mvc.perform(write(post("/api/v1/workspace/manual-chapters/" + chapter + "/move"))
                .cookie(cookie(MEMBER))
                .content("{\"expectedVersion\":" + version + ","
                        + (parent == null ? "" : "\"parentId\":\"" + parent + "\",") + "\"index\":" + index + "}"));
    }

    private UUID create(String key, UUID folder, String title) throws Exception {
        if (key == null) key = "SAFE";
        return created("{" + ("\"projectKey\":\"" + key + "\",")
                + (folder == null ? "" : "\"folderId\":\"" + folder + "\",") + "\"title\":\"" + title + "\"}");
    }

    private UUID createMarkdown(String key, String title, String markdown) throws Exception {
        if (key == null) key = "SAFE";
        return created("{" + ("\"projectKey\":\"" + key + "\",") + "\"title\":\"" + title + "\",\"markdown\":"
                + JSON.writeValueAsString(markdown) + "}");
    }

    private UUID created(String content) throws Exception {
        String location = mvc.perform(write(post("/api/v1/workspace/documents"))
                        .cookie(cookie(MEMBER))
                        .content(content))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");
        String path = Objects.requireNonNull(location, "Location");
        return UUID.fromString(path.substring(path.lastIndexOf('/') + 1));
    }

    private static String save(long version, String text, boolean checkpoint) {
        return "{\"expectedVersion\":" + version
                + ",\"body\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\""
                + text + "\"}]}]},\"uploadIds\":[],\"checkpoint\":" + checkpoint
                + ",\"schemaVersion\":1}";
    }

    private void member(UUID id, String name, String email, Role... roles) {
        Accounts.upsert(jdbc, id, email, true, roles);
        Members.insert(jdbc, Members.member(id, name, email));
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
        var tree = JSON.readTree(result.getResponse().getContentAsString());
        return builder.cookie(result.getResponse().getCookies())
                .header(tree.path("headerName").asText(), tree.path("token").asText())
                .header("Origin", "http://localhost:4402")
                .contentType("application/json");
    }
}

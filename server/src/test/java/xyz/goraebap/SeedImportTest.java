package xyz.goraebap;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import tools.jackson.databind.json.JsonMapper;
import xyz.goraebap.foundation.seed.application.SeedImporter;
import xyz.goraebap.shared.web.Role;
import xyz.goraebap.support.Accounts;
import xyz.goraebap.support.Members;
import xyz.goraebap.support.TestDatabase;

/**
 * Seeding a server nobody can call the API for (cowork-guide-architecture, 개발 서버 채우기): the JSON files in its seed
 * folder are brought in once each, a project's issues with their labels, children, Redmine parents and comments, and
 * documents in folders, keeping who wrote them and when where a member has that name and naming the writer otherwise,
 * telling nobody. A file that fails is rolled back and left unrecorded, to be brought in once fixed.
 */
@SpringBootTest
@ActiveProfiles("test")
@Tag("integration")
class SeedImportTest {
    private static final UUID IMPORTER = id(1);
    private static final UUID WHALE = id(2);
    private static final UUID SEHO = id(3);
    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final Path FOLDER = folder();

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    SeedImporter seedImporter;

    @DynamicPropertySource
    static void seedFolder(DynamicPropertyRegistry registry) {
        registry.add("app.seed.dir", FOLDER::toString);
        registry.add("app.seed.actor-email", () -> "Importer@Example.test");
    }

    @BeforeEach
    void prepare() throws IOException {
        TestDatabase.clear(jdbc);
        member(IMPORTER, "가져온이", "importer@example.test", Role.INSTANCE_ADMIN);
        member(WHALE, "김고래", "whale@example.test");
        member(SEHO, "정세호", "seho@example.test");
        try (var files = Files.list(FOLDER)) {
            for (Path file : files.toList()) Files.delete(file);
        }
    }

    @Test
    void theSeedFilesComeInOnceEachKeepingWhoWroteWhatAndWhen() throws IOException {
        // The documents file sorts first by name but comes in after the project file that gives cowork its mark.
        write(
                "a-gitifact.json",
                Map.of(
                        "documents",
                        List.of(
                                Map.of(
                                        "path", List.of("명세", "the workspace", "요구사항"),
                                        "title", "프로젝트 목록과 즐겨찾기",
                                        "body", "구성원으로서 프로젝트를 찾고 싶다.\n\n- 목록\n- 즐겨찾기",
                                        "sourceId", "R-cmmvdlrtka",
                                        "description", "구성원이 프로젝트를 찾아 연다"),
                                Map.of(
                                        "path", List.of("결정기록", "2026-09"),
                                        "title", "결정 하나",
                                        "body", "## 맥락\n\n있는 그대로",
                                        "sourceId", "DR-3x7ww4ktol",
                                        "date", "20260927"))));
        write(
                "cowork.json",
                Map.of(
                        "project",
                                Map.of(
                                        "key",
                                        "cowork",
                                        "name",
                                        "cowork",
                                        "description",
                                        "자체 개발",
                                        "icon",
                                        "release",
                                        "color",
                                        "#5e6ad2"),
                        "labels", List.of("프로젝트", "문서"),
                        "issues",
                                List.of(Map.of(
                                        "title", "BIT 기반으로 대체",
                                        "type", "에픽",
                                        "status", "진행 중",
                                        "priority", "높음",
                                        "description", "## 범위\n\n- [ ] 이슈",
                                        "labels", List.of("프로젝트"),
                                        "children",
                                                List.of(Map.of(
                                                        "title", "문서 옮기기",
                                                        "type", "작업",
                                                        "status", "완료",
                                                        "priority", "보통",
                                                        "description", "V27",
                                                        "labels", List.of("문서", "운영")))))));
        write(
                "safety_solution.json",
                Map.of(
                        "project", Map.of("key", "SAFE", "name", "안전관리 솔루션", "description", "Redmine에서 옮김"),
                        "issues",
                                List.of(
                                        redmine(101, "에픽", "사업 기획", "진행완료", null, "서의교", "김고래", List.of()),
                                        redmine(
                                                102,
                                                "유저 스토리",
                                                "로그인",
                                                "작업전",
                                                101L,
                                                "김고래",
                                                "기획팀",
                                                List.of(
                                                        Map.of(
                                                                "author",
                                                                "정세호",
                                                                "body",
                                                                "확인했습니다\\n다음 주에",
                                                                "at",
                                                                "2026-06-04 06:58:08"),
                                                        Map.of(
                                                                "author",
                                                                "김없음",
                                                                "body",
                                                                "의견입니다",
                                                                "at",
                                                                "2026-06-05 01:00:00"))),
                                        redmine(103, "태스크", "거절된 일", "작업거절", null, null, null, List.of()))));
        write(
                "broken.json",
                Map.of(
                        "project", Map.of("key", "NO KEY!", "name", "잘못된 키"),
                        "issues", List.of(Map.of("title", "들어가지 않는다"))));
        write("notes.txt", Map.of("documents", List.of()));

        assertThat(seedImporter.importAll()).isEqualTo(3);

        // The project file came first: cowork has its mark, the importer as its member, and its labels.
        assertThat(jdbc.queryForMap(
                        "SELECT icon, color FROM project p JOIN project_key k ON k.project_id = p.project_id"
                                + " WHERE k.prefix = 'COWORK'"))
                .containsEntry("icon", "release")
                .containsEntry("color", "#5e6ad2");
        assertThat(jdbc.queryForList(
                        "SELECT user_id FROM project_member m JOIN project_key k ON k.project_id = m.project_id"
                                + " WHERE k.prefix = 'SAFE'",
                        String.class))
                .containsExactly(IMPORTER.toString());
        assertThat(jdbc.queryForList("SELECT name FROM issue_label ORDER BY position", String.class))
                .containsExactly("프로젝트", "문서", "운영");

        var epic = issue("COWORK", 1);
        assertThat(epic).containsEntry("type", "EPIC").containsEntry("priority", "HIGH");
        assertThat(epic.get("column_name")).isEqualTo("진행 중");
        var child = issue("COWORK", 2);
        assertThat(child.get("parent_id")).isEqualTo(epic.get("issue_id"));
        assertThat(child.get("column_name")).isEqualTo("완료");
        assertThat(child.get("closed_at")).isNotNull();
        assertThat(jdbc.queryForObject(
                        "SELECT count(*) FROM issue_label_link WHERE issue_id = ?",
                        Integer.class,
                        child.get("issue_id")))
                .isEqualTo(2);
        assertThat(body(epic)).contains("\"taskItem\"");

        // Redmine's issues keep their order, parents, people and times; the body says where it came from.
        var plan = issue("SAFE", 1);
        assertThat(plan).containsEntry("type", "EPIC").containsEntry("created_by", IMPORTER.toString());
        assertThat(plan.get("column_name")).isEqualTo("완료");
        assertThat(plan.get("assignee_id")).isEqualTo(WHALE.toString());
        assertThat(Instant.parse((String) plan.get("created_at"))).isEqualTo(Instant.parse("2026-06-02T04:51:53Z"));
        assertThat(body(plan)).contains("Redmine #101에서 옮김", "원래 작성자: 서의교").doesNotContain("\\\\n");
        var login = issue("SAFE", 2);
        assertThat(login)
                .containsEntry("type", "FEATURE")
                .containsEntry("priority", "MEDIUM")
                .containsEntry("created_by", WHALE.toString())
                .containsEntry("parent_id", plan.get("issue_id"));
        assertThat(login.get("assignee_id")).isNull();
        assertThat(login.get("column_name")).isEqualTo("할 일");
        assertThat(body(login)).contains("원래 담당자: 기획팀").contains("첫 줄").contains("둘째 줄");
        assertThat(issue("SAFE", 3).get("column_name")).isEqualTo("취소");
        var comments = jdbc.queryForList(
                "SELECT body, created_by, created_at FROM activity_entry WHERE owner_id = ? AND kind = 'COMMENT' ORDER BY created_at",
                login.get("issue_id"));
        assertThat(comments).hasSize(2);
        assertThat(comments.get(0)).containsEntry("body", "확인했습니다\n다음 주에").containsEntry("created_by", SEHO.toString());
        assertThat(Instant.parse((String) comments.get(0).get("created_at")))
                .isEqualTo(Instant.parse("2026-06-04T06:58:08Z"));
        assertThat(comments.get(1))
                .containsEntry("body", "원래 작성자: 김없음\n\n의견입니다")
                .containsEntry("created_by", IMPORTER.toString());

        // Documents went in cowork's space, in the folders their paths name, titled by their source id.
        var spec = document("[R-cmmvdlrtka] 프로젝트 목록과 즐겨찾기");
        assertThat(labelsFor(spec.get("document_id"))).containsExactlyInAnyOrder("명세", "the workspace", "요구사항");
        assertThat(body(spec.get("document_id"))).contains("\"blockquote\"", "구성원이 프로젝트를 찾아 연다");
        var record = document("[DR-3x7ww4ktol] 결정 하나");
        assertThat(labelsFor(record.get("document_id"))).containsExactlyInAnyOrder("결정기록", "2026-09");
        assertThat(Instant.parse((String) record.get("created_at"))).isEqualTo(Instant.parse("2026-09-27T00:00:00Z"));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM document_folder", Integer.class))
                .isZero();

        // Nobody was told: an assignee given work by someone else hears nothing of an import.
        assertThat(jdbc.queryForObject("SELECT count(*) FROM notification_event", Integer.class))
                .isZero();

        // The broken file left nothing and no record; the others are recorded and never come in again.
        assertThat(jdbc.queryForList("SELECT file_name FROM seed_import ORDER BY file_name", String.class))
                .containsExactly("a-gitifact.json", "cowork.json", "safety_solution.json");
        assertThat(jdbc.queryForObject(
                        "SELECT summary FROM seed_import WHERE file_name = 'safety_solution.json'", String.class))
                .isEqualTo("issues: SAFE 이슈 3 · 댓글 2 · 라벨 0");
        assertThat(seedImporter.importAll()).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM issue", Integer.class))
                .isEqualTo(5);

        // Fixed, the broken file comes in on the next run.
        write(
                "broken.json",
                Map.of(
                        "project", Map.of("key", "FIXED", "name", "고친 키"),
                        "issues", List.of(Map.of("title", "이제 들어간다"))));
        assertThat(seedImporter.importAll()).isEqualTo(1);
        assertThat(issue("FIXED", 1).get("column_name")).isEqualTo("할 일");
    }

    private static Map<String, Object> redmine(
            long id,
            String type,
            String title,
            String status,
            Long parent,
            String author,
            String assignee,
            List<Map<String, String>> comments) {
        var issue = new LinkedHashMap<String, Object>();
        issue.put("redmineId", id);
        issue.put("type", type);
        issue.put("title", title);
        issue.put("description", "첫 줄\\n둘째 줄");
        issue.put("status", status);
        issue.put("closed", !status.equals("작업전"));
        issue.put("priority", "보통");
        issue.put("assignee", assignee);
        issue.put("author", author);
        issue.put("parentRedmineId", parent);
        issue.put("startDate", "2026-05-28");
        issue.put("dueDate", "2026-06-30");
        issue.put("createdAt", "2026-06-02 04:51:53");
        issue.put("updatedAt", "2026-06-02 04:53:13");
        issue.put("comments", comments);
        return issue;
    }

    private Map<String, Object> issue(String key, long number) {
        return jdbc.queryForMap(
                "SELECT i.*, c.name AS column_name FROM issue i JOIN issue_column c ON c.column_id = i.column_id"
                        + " JOIN project_key k ON k.project_id = i.project_id WHERE k.prefix = ? AND i.number = ?",
                key,
                number);
    }

    private Map<String, Object> document(String title) {
        return jdbc.queryForMap(
                "SELECT d.* FROM document d JOIN project_key k ON k.project_id = d.project_id"
                        + " WHERE k.prefix = 'COWORK' AND d.title = ?",
                title);
    }

    private String body(Map<String, Object> issue) {
        return body(issue.get("issue_id"));
    }

    private String body(Object ownerId) {
        return jdbc.queryForObject("SELECT body FROM rich_body WHERE owner_id = ?", String.class, ownerId);
    }

    private java.util.List<String> labelsFor(Object id) {
        return jdbc.queryForList(
                "SELECT l.name FROM document_label l JOIN document_label_link x ON x.label_id=l.label_id WHERE x.document_id=?",
                String.class,
                id);
    }

    private static void write(String name, Object content) throws IOException {
        Files.writeString(FOLDER.resolve(name), JSON.writeValueAsString(content));
    }

    private void member(UUID id, String name, String email, Role... roles) {
        Accounts.upsert(jdbc, id, email, true, roles);
        Members.insert(jdbc, Members.member(id, name, email));
    }

    private static Path folder() {
        try {
            return Files.createTempDirectory("cowork-seed");
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    private static UUID id(int value) {
        return UUID.fromString(String.format("00000000-0000-0000-0000-%012d", value));
    }
}

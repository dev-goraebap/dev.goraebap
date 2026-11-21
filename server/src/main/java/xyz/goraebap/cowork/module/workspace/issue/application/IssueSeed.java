package xyz.goraebap.cowork.module.workspace.issue.application;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import xyz.goraebap.cowork.module.seed.SeedAuthors;
import xyz.goraebap.cowork.module.seed.SeedFormatSpi;
import xyz.goraebap.cowork.module.workspace.activity.ActivityFacade;
import xyz.goraebap.cowork.module.workspace.issue.application.board.BoardService;
import xyz.goraebap.cowork.module.workspace.issue.application.board.BoardViews;
import xyz.goraebap.cowork.module.workspace.issue.application.body.IssueBodyService;
import xyz.goraebap.cowork.module.workspace.issue.application.comment.IssueCommentRequests;
import xyz.goraebap.cowork.module.workspace.issue.application.comment.IssueCommentService;
import xyz.goraebap.cowork.module.workspace.issue.application.issue.IssueRequests;
import xyz.goraebap.cowork.module.workspace.issue.application.issue.IssueService;
import xyz.goraebap.cowork.module.workspace.issue.application.label.LabelRequests;
import xyz.goraebap.cowork.module.workspace.issue.application.label.LabelService;
import xyz.goraebap.cowork.module.workspace.issue.domain.board.ColumnCategory;
import xyz.goraebap.cowork.module.workspace.issue.domain.issue.Issue;
import xyz.goraebap.cowork.module.workspace.issue.domain.issue.IssuePriority;
import xyz.goraebap.cowork.module.workspace.issue.domain.issue.IssueRepository;
import xyz.goraebap.cowork.module.workspace.project.NewProject;
import xyz.goraebap.cowork.module.workspace.project.ProjectFacade;
import xyz.goraebap.cowork.module.workspace.project.ProjectSummary;
import xyz.goraebap.cowork.module.workspace.richbody.RichBodyFacade;

/**
 * A seed file of a project's issues (cowork-guide-architecture, 개발 서버 채우기): {project, labels?, issues}. The
 * project is made when no project has its key, the importer its member; labels are made by name in the palette's
 * colours in turn. Each issue goes in the order given, its children (children), the issue it names by Redmine id
 * (parentRedmineId) or the issue the file gave that ref (parentRef, a cowork export's DEMO-3) as its parent, so numbers
 * follow the file. Words the file uses become cowork's: the type (에픽, 유저
 * 스토리, 태스크 …), the status as the default board's column (Redmine's 작업전 · 진행 · 의견 · 진행완료 · 작업거절 too), the
 * priority. The writer and the time written stay where the file gives them; a writer who is no member becomes the
 * importer and the body or comment says who it was. An issue from Redmine ends with where it came from. Nobody is told.
 */
@Component
@RequiredArgsConstructor
class IssueSeed implements SeedFormatSpi {
    /** Label colours in turn, from the palette the screens pick from (shared/config/palette.ts), the greys left out. */
    static final List<String> LABEL_COLORS = List.of(
            "#5e6ad2", "#4cb782", "#f2994a", "#26b5ce", "#bb87fc", "#eb5757", "#f2c94c", "#4a90e2", "#d660c8",
            "#20b2a0", "#f06595", "#94c847");

    /** Redmine's times, in UTC. */
    private static final DateTimeFormatter REDMINE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd[ ]['T']HH:mm:ss[X]");

    private static final Map<String, String> TYPES = Map.ofEntries(
            Map.entry("에픽", "EPIC"),
            Map.entry("epic", "EPIC"),
            Map.entry("유저 스토리", "FEATURE"),
            Map.entry("기능", "FEATURE"),
            Map.entry("feature", "FEATURE"),
            Map.entry("버그", "BUG"),
            Map.entry("bug", "BUG"));

    /** A status as the default board's column, and the category to fall back on when a board has other names. */
    private static final Map<String, Status> STATUSES = Map.ofEntries(
            Map.entry("백로그", new Status("백로그", ColumnCategory.BACKLOG)),
            Map.entry("할 일", new Status("할 일", ColumnCategory.UNSTARTED)),
            Map.entry("작업전", new Status("할 일", ColumnCategory.UNSTARTED)),
            Map.entry("신규", new Status("할 일", ColumnCategory.UNSTARTED)),
            Map.entry("진행 중", new Status("진행 중", ColumnCategory.STARTED)),
            Map.entry("진행", new Status("진행 중", ColumnCategory.STARTED)),
            Map.entry("검토 중", new Status("검토 중", ColumnCategory.STARTED)),
            Map.entry("의견", new Status("검토 중", ColumnCategory.STARTED)),
            Map.entry("완료", new Status("완료", ColumnCategory.COMPLETED)),
            Map.entry("진행완료", new Status("완료", ColumnCategory.COMPLETED)),
            Map.entry("취소", new Status("취소", ColumnCategory.CANCELED)),
            Map.entry("작업거절", new Status("취소", ColumnCategory.CANCELED)));

    private static final Map<String, IssuePriority> PRIORITIES = Map.of(
            "긴급", IssuePriority.URGENT,
            "즉시", IssuePriority.URGENT,
            "높음", IssuePriority.HIGH,
            "보통", IssuePriority.MEDIUM,
            "낮음", IssuePriority.LOW);

    private final ProjectFacade projectFacade;
    private final IssueService issueService;
    private final IssueCommentService issueCommentService;
    private final IssueBodyService issueBodyService;
    private final IssueRepository issueRepository;
    private final BoardService boardService;
    private final LabelService labelService;
    private final RichBodyFacade richBodyFacade;
    private final JsonMapper jsonMapper;
    private final Clock clock;

    @Override
    public String name() {
        return "issues";
    }

    @Override
    public int order() {
        return 0;
    }

    @Override
    public boolean accepts(JsonNode file) {
        return file.path("project").isObject() && file.path("issues").isArray();
    }

    @Override
    public String load(JsonNode node, SeedAuthors authors) {
        var file = jsonMapper.treeToValue(node, SeedFile.class);
        Instant now = clock.instant();
        var project = projectFacade.findOrCreate(
                authors.importer(),
                now,
                new NewProject(
                        file.project().key(),
                        file.project().name(),
                        file.project().description(),
                        file.project().icon(),
                        file.project().color()));
        var run = new Run(project, authors, now, boardService.importedColumns(project.key()), labels(project));
        for (var name : file.labels()) run.label(name);
        for (var issue : file.issues()) bring(run, issue, null);
        return project.key() + " 이슈 " + run.issues + " · 댓글 " + run.comments + " · 라벨 " + run.labelsMade;
    }

    /** One issue and what it holds: its body and comments, then its children under it. */
    private void bring(Run run, SeedIssue issue, UUID parentId) {
        var author = run.authors.author(issue.author());
        Instant at = time(issue.createdAt()).orElse(run.now);
        var labelIds = new LinkedHashSet<UUID>();
        for (var name : issue.labels()) labelIds.add(run.label(name));
        LocalDate start = date(issue.startDate());
        LocalDate due = date(issue.dueDate());
        if (start != null && due != null && start.isAfter(due)) start = null;
        UUID parent = parentId != null
                ? parentId
                : Optional.ofNullable(issue.parentRedmineId())
                        .map(run.byRedmineId::get)
                        .or(() -> Optional.ofNullable(strip(issue.parentRef())).map(ref -> {
                            var found = run.byRef.get(ref);
                            if (found == null)
                                throw new IllegalArgumentException("상위 " + ref + "가 앞에 없습니다: " + issue.title());
                            return found;
                        }))
                        .orElse(null);
        long number = issueService.create(
                author.id(),
                at,
                run.project.key(),
                new IssueRequests.CreateIssue(
                        clip(issue.title(), Issue.TITLE_MAX),
                        type(issue.type()),
                        run.column(issue.status(), Boolean.TRUE.equals(issue.closed())),
                        priority(issue.priority()),
                        run.authors.member(issue.assignee()).orElse(null),
                        start,
                        due,
                        parent,
                        labelIds,
                        null,
                        null,
                        null));
        run.issues++;
        UUID id = issueRepository
                .findByProjectIdAndNumber(run.project.id(), number)
                .map(Issue::id)
                .orElseThrow(IssueErrorCode.ISSUE_NOT_FOUND::raise);
        if (issue.redmineId() != null) run.byRedmineId.put(issue.redmineId(), id);
        if (strip(issue.ref()) != null) run.byRef.put(issue.ref().strip(), id);
        String body = body(issue, author, run.authors);
        if (!body.isBlank())
            issueBodyService.replace(author.id(), run.project.key(), number, richBodyFacade.fromMarkdown(body));
        for (var comment : issue.comments()) {
            var writer = run.authors.author(comment.author());
            String text =
                    unescaped(Objects.requireNonNullElse(comment.body(), "")).strip();
            if (writer.note().isPresent()) text = writer.note().get() + "\n\n" + text;
            if (text.isBlank()) continue;
            issueCommentService.add(
                    writer.id(),
                    time(comment.at()).orElse(at),
                    run.project.key(),
                    number,
                    new IssueCommentRequests.CommentInput(clip(text, ActivityFacade.COMMENT_MAX)));
            run.comments++;
        }
        for (var child : issue.children()) bring(run, child, id);
    }

    /**
     * The body in Markdown: the description, then where it came from and who first wrote it or had it when they are no
     * member.
     */
    private static String body(SeedIssue issue, SeedAuthors.Author author, SeedAuthors authors) {
        var notes = new ArrayList<String>();
        if (issue.redmineId() != null) notes.add("Redmine #" + issue.redmineId() + "에서 옮김");
        author.note().ifPresent(notes::add);
        String assignee = strip(issue.assignee());
        if (assignee != null && authors.member(assignee).isEmpty()) notes.add("원래 담당자: " + assignee);
        String description =
                unescaped(Objects.requireNonNullElse(issue.description(), "")).strip();
        if (notes.isEmpty()) return description;
        String footer = String.join(" · ", notes);
        return description.isEmpty() ? footer : description + "\n\n---\n\n" + footer;
    }

    /** The workspace's labels by name whatever their case, read before the file adds its own. */
    private Map<String, UUID> labels(ProjectSummary project) {
        return labelService.labels().stream()
                .collect(Collectors.toMap(
                        label -> label.name().toLowerCase(Locale.ROOT), label -> label.id(), (first, second) -> first));
    }

    private static IssuePriority priority(String word) {
        return Optional.ofNullable(strip(word)).map(PRIORITIES::get).orElse(IssuePriority.NONE);
    }

    private static String type(String word) {
        String type = strip(word);
        return type == null ? "TASK" : TYPES.getOrDefault(type.toLowerCase(Locale.ROOT), "TASK");
    }

    /** A Redmine time (2026-06-02 04:51:53, UTC) or an ISO instant. */
    private static Optional<Instant> time(String text) {
        String value = strip(text);
        if (value == null) return Optional.empty();
        try {
            return Optional.of(Instant.parse(value));
        } catch (DateTimeParseException notInstant) {
            try {
                return Optional.of(LocalDateTime.parse(value, REDMINE_TIME).toInstant(ZoneOffset.UTC));
            } catch (DateTimeParseException invalid) {
                throw new IllegalArgumentException("시각을 읽지 못했습니다: " + value, invalid);
            }
        }
    }

    private static LocalDate date(String text) {
        String value = strip(text);
        return value == null ? null : LocalDate.parse(value);
    }

    /**
     * Text whose line breaks came written out (\n, as Redmine's export gives them) with real ones; text that has real
     * line breaks already is left as it is.
     */
    static String unescaped(String text) {
        if (text.indexOf('\n') >= 0 || !text.contains("\\n")) return text;
        return text.replace("\\r\\n", "\n").replace("\\n", "\n").replace("\\t", "\t");
    }

    private static String clip(String text, int max) {
        String value = Objects.requireNonNullElse(text, "").strip();
        return value.length() <= max ? value : value.substring(0, max - 1) + "…";
    }

    private static String strip(String text) {
        return text == null || text.isBlank() ? null : text.strip();
    }

    /** One file's run: the project, its board and labels, and what was made, Redmine ids to issues among it. */
    private final class Run {
        final ProjectSummary project;
        final SeedAuthors authors;
        final Instant now;
        final List<BoardViews.ColumnView> columns;
        final Map<String, UUID> labels;
        final Map<Long, UUID> byRedmineId = new HashMap<>();
        final Map<String, UUID> byRef = new HashMap<>();
        int issues;
        int comments;
        int labelsMade;

        Run(
                ProjectSummary project,
                SeedAuthors authors,
                Instant now,
                List<BoardViews.ColumnView> columns,
                Map<String, UUID> labels) {
            this.project = project;
            this.authors = authors;
            this.now = now;
            this.columns = columns;
            this.labels = new LinkedHashMap<>(labels);
        }

        /** The project's label of that name, made in the next colour when it has none. */
        UUID label(String name) {
            String wanted = strip(name);
            if (wanted == null) throw new IllegalArgumentException("이름 없는 라벨이 있습니다");
            return labels.computeIfAbsent(wanted.toLowerCase(Locale.ROOT), key -> {
                String color = LABEL_COLORS.get(labels.size() % LABEL_COLORS.size());
                labelsMade++;
                return labelService.create(authors.importer(), now, new LabelRequests.LabelInput(wanted, color));
            });
        }

        /**
         * The column a status names: the default board's column of that name, else the first of its category; an
         * unknown status goes by whether the issue was closed, to 완료 or to the first column waiting to start.
         */
        UUID column(String status, boolean closed) {
            var wanted = Optional.ofNullable(strip(status))
                    .map(STATUSES::get)
                    .orElse(
                            closed
                                    ? new Status("완료", ColumnCategory.COMPLETED)
                                    : new Status("할 일", ColumnCategory.UNSTARTED));
            return columns.stream()
                    .filter(column -> column.name().equals(wanted.column()))
                    .findFirst()
                    .or(() -> columns.stream()
                            .filter(column -> column.category() == wanted.category())
                            .findFirst())
                    .map(BoardViews.ColumnView::id)
                    .orElse(null);
        }
    }

    private record Status(String column, ColumnCategory category) {}

    record SeedFile(SeedProject project, List<String> labels, List<SeedIssue> issues) {
        SeedFile {
            if (project == null || project.key() == null) throw new IllegalArgumentException("project.key가 없습니다");
            labels = labels == null ? List.of() : List.copyOf(labels);
            issues = issues == null ? List.of() : List.copyOf(issues);
        }
    }

    record SeedProject(String key, String name, String description, String icon, String color) {}

    /**
     * An issue of either shape: cowork's own (children, labels; an export's ref and parentRef, the issue's number where it
     * came from) or Redmine's export (ids, people, times, comments).
     */
    record SeedIssue(
            String ref,
            String parentRef,
            Long redmineId,
            String type,
            String title,
            String description,
            String status,
            Boolean closed,
            String priority,
            String assignee,
            String author,
            Long parentRedmineId,
            String startDate,
            String dueDate,
            String createdAt,
            String updatedAt,
            List<String> labels,
            List<SeedComment> comments,
            List<SeedIssue> children) {
        SeedIssue {
            labels = labels == null ? List.of() : List.copyOf(labels);
            comments = comments == null ? List.of() : List.copyOf(comments);
            children = children == null ? List.of() : List.copyOf(children);
        }
    }

    record SeedComment(String author, String body, String at) {}
}

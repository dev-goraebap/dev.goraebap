package xyz.goraebap.workspace.issue.application;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.foundation.mcp.McpArguments;
import xyz.goraebap.foundation.mcp.McpChangeSource;
import xyz.goraebap.foundation.mcp.McpTool;
import xyz.goraebap.foundation.mcp.McpToolProvider;
import xyz.goraebap.foundation.user.UserFacade;
import xyz.goraebap.workspace.issue.application.board.BoardService;
import xyz.goraebap.workspace.issue.application.board.BoardViews;
import xyz.goraebap.workspace.issue.application.body.IssueBodyService;
import xyz.goraebap.workspace.issue.application.comment.IssueCommentRequests;
import xyz.goraebap.workspace.issue.application.comment.IssueCommentService;
import xyz.goraebap.workspace.issue.application.cycle.CycleModels;
import xyz.goraebap.workspace.issue.application.cycle.CycleService;
import xyz.goraebap.workspace.issue.application.issue.IssueRequests;
import xyz.goraebap.workspace.issue.application.issue.IssueService;
import xyz.goraebap.workspace.issue.application.issue.IssueViews;
import xyz.goraebap.workspace.issue.application.label.LabelService;
import xyz.goraebap.workspace.issue.application.label.LabelViews;
import xyz.goraebap.workspace.issue.application.time.TimeEntryModels;
import xyz.goraebap.workspace.issue.application.time.TimeEntryService;
import xyz.goraebap.workspace.issue.application.type.TypeService;
import xyz.goraebap.workspace.issue.domain.board.ColumnCategory;
import xyz.goraebap.workspace.issue.domain.cycle.Cycle;
import xyz.goraebap.workspace.issue.domain.issue.IssueActivity;
import xyz.goraebap.workspace.issue.domain.issue.IssuePriority;
import xyz.goraebap.workspace.richbody.RichBodyFacade;
import xyz.goraebap.workspace.richbody.RichBodyMarkdown;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/**
 * Issues as an agent reads and writes them, through the services the issue screens use, so
 * the same permissions, versions, timeline and notices apply. Agents name things as people do: an issue by KEY-number,
 * a project by key, a column, label or person by name (me for the token's member, none to clear). Bodies go both ways
 * as Markdown (RichBodyMarkdown out, RichBodyFacade.fromMarkdown in); comments are plain text, as on the screen.
 */
@Component
@RequiredArgsConstructor
public class IssueMcpTools implements McpToolProvider, McpChangeSource {
    /** The longest body an agent reads at once; past it the text is cut and says so. */
    static final int BODY_SHOWN = 30_000;

    private static final List<String> STATUSES =
            List.of("open", "closed", "all", "backlog", "unstarted", "started", "completed", "canceled");
    private static final List<String> STORY_POINTS = List.of("0.5", "1", "2", "3", "5", "8", "13");
    private static final List<String> STORY_POINTS_OR_NONE = List.of("0.5", "1", "2", "3", "5", "8", "13", "none");

    /** How many timeline entries get_issue shows at once, the latest. */
    static final int TIMELINE_SHOWN = 10;

    private static final List<String> PRIORITIES = List.of("none", "urgent", "high", "medium", "low");

    private final IssueService issueService;
    private final IssueBodyService issueBodyService;
    private final IssueCommentService issueCommentService;
    private final BoardService boardService;
    private final LabelService labelService;
    private final TypeService typeService;
    private final TimeEntryService timeEntryService;
    private final CycleService cycleService;
    private final IssueProjects issueProjects;
    private final RichBodyFacade richBodyFacade;
    private final org.springframework.transaction.PlatformTransactionManager transactionManager;
    private final UserFacade userFacade;

    @Override
    public List<McpTool> tools() {
        return List.of(
                McpTool.read(
                        "list_issue_types",
                        "업무 유형 찾기",
                        "모든 프로젝트가 함께 쓰는 현재 업무 유형을 설정 순서로 돌려줍니다. code는 이슈에 저장하는 값, name은 현재 표시명, isDefault는 유형을 생략한 새 이슈의 기본값입니다. 이슈를 만들거나 유형을 바꾸기 전에 조회하고, 반환한 코드나 이름을 type에 쓰세요. 유형 이름과 개수를 고정해서 가정하지 마세요.",
                        McpTool.input(),
                        (actor, arguments) -> Map.of(
                                "scope",
                                "workspace",
                                "types",
                                typeService.types().stream()
                                        .map(type -> Map.of(
                                                "code", type.code(),
                                                "name", type.name(),
                                                "position", type.position(),
                                                "isDefault", type.isDefault()))
                                        .toList())),
                McpTool.read(
                        "get_project_board",
                        "보드 칸과 라벨",
                        "프로젝트 보드의 상태(칸) 이름과 분류(backlog·unstarted·started·completed·canceled), 라벨 이름을 순서대로 돌려줍니다. update_issue의 column, labels에 이 이름을 씁니다.",
                        McpTool.input().string("project", "프로젝트 키", true),
                        (actor, arguments) -> board(actor, arguments.string("project"))),
                McpTool.read(
                        "list_issues",
                        "이슈 찾기",
                        "이슈를 짧은 줄(참조, 제목, 상태, 유형, 담당, 라벨, 바뀐 때)로 찾습니다. 기본은 모든 프로젝트의 열린 이슈(완료·취소 제외)를 최근 바뀐 순으로. project로 프로젝트를, status로 상태 분류를(open·closed·all 또는 분류 하나), column으로 칸 이름을, assignee로 담당자(me·none·이름)를, label로 라벨 이름을, type·priority로 유형·우선순위를, q로 제목 일부나 번호를, updated_since로 그 뒤에 바뀐 것만 거릅니다. 본문과 활동은 get_issue로. 다음 조각은 nextCursor를 cursor로 주세요.",
                        McpTool.input()
                                .string("project", "프로젝트 키. column·label을 쓰려면 필요합니다", false)
                                .choice("status", "상태 분류 (기본 open)", STATUSES, false)
                                .string("column", "칸 이름 (project 필요)", false)
                                .string("assignee", "담당자: me, none, 또는 구성원 이름", false)
                                .string("label", "라벨 이름 (project 필요)", false)
                                .string("type", "list_issue_types로 확인한 업무 유형 이름이나 코드", false)
                                .choice("priority", "우선순위", PRIORITIES, false)
                                .string("cycle", "사이클 이름, current(진행 중인 사이클) 또는 none (project 필요)", false)
                                .string("q", "제목 일부, 번호 또는 KEY-번호", false)
                                .string("updated_since", "이 뒤에 바뀐 것만 (ISO 시각 또는 YYYY-MM-DD)", false)
                                .choice(
                                        "sort",
                                        "정렬 (기본 updated, board는 project 필요)",
                                        List.of("updated", "created", "board"),
                                        false)
                                .integer("size", "한 번에 볼 개수 (기본 30)", 1, 100)
                                .string("cursor", "앞 응답의 nextCursor", false),
                        this::list),
                McpTool.read(
                        "get_issue",
                        "이슈 보기",
                        "이슈 하나를 참조(KEY-번호)로 돌려줍니다: 속성, 상위·하위 이슈, Markdown 본문, 그리고 댓글과 활동 중 최근 것(기본 10개, 오래된 순; 댓글은 인용한 본문 글과 답글 대상도). 더 앞의 활동은 timelineCursor를 timeline_before로 주세요. 작업을 시작하기 전에 읽으세요.",
                        McpTool.input()
                                .string("ref", "이슈 참조 (예: DEMO-12)", true)
                                .bool("include_timeline", "댓글과 활동도 함께 볼지 (기본 true)")
                                .integer("timeline_size", "볼 활동 수 (기본 10)", 1, 100)
                                .string("timeline_before", "앞 응답의 timelineCursor", false),
                        (actor, arguments) -> get(actor, arguments)),
                McpTool.write(
                        "create_issue",
                        "이슈 만들기",
                        "프로젝트에 이슈를 만들고 참조(KEY-번호)를 돌려줍니다. 칸을 주지 않으면 첫 '할 일' 칸에 들어갑니다. body는 Markdown입니다. 사람·라벨·칸은 이름으로, 상위 이슈는 같은 프로젝트의 참조로 줍니다.",
                        McpTool.input()
                                .string("project", "프로젝트 키", true)
                                .string("title", "제목: 끝나면 무엇이 달라지는지 한 줄 (200자까지)", true)
                                .string("body", "본문 (Markdown)", false)
                                .string("type", "list_issue_types로 확인한 이름이나 코드 (생략: 현재 기본 유형)", false)
                                .string("column", "칸 이름", false)
                                .choice("status", "칸 대신 상태 분류로 (그 분류의 첫 칸)", STATUSES.subList(3, 8), false)
                                .choice("priority", "우선순위 (기본 medium)", PRIORITIES, false)
                                .string("assignee", "담당자: me 또는 구성원 이름", false)
                                .strings("labels", "라벨 이름 목록", false)
                                .string("start_date", "시작일 YYYY-MM-DD", false)
                                .string("due_date", "기한 YYYY-MM-DD", false)
                                .number("estimate_hours", "추정시간(시간, 0.25 = 15분). 계획한 공수", 0.02, 1000, false)
                                .choice("story_points", "스토리 포인트", STORY_POINTS, false)
                                .string("cycle", "사이클 이름, 또는 current(진행 중인 사이클)", false)
                                .string("parent", "상위 이슈 참조", false),
                        (actor, arguments) -> new org.springframework.transaction.support.TransactionTemplate(
                                        transactionManager)
                                .execute(status -> create(actor, arguments))),
                McpTool.write(
                        "update_issue",
                        "이슈 고치기",
                        "준 값만 바꿉니다. column(칸 이름)이나 status(분류)로 상태를 옮기고, assignee·start_date·due_date·parent는 none으로 비웁니다. labels는 준 목록으로 통째로 바뀝니다. 본문은 set_issue_body로 바꿉니다. comment로 상태·속성 변경과 보고를 함께 남기세요. completed는 한 일·검증·남은 일, canceled는 취소 이유를 적습니다.",
                        McpTool.input()
                                .string("ref", "이슈 참조", true)
                                .string("title", "새 제목", false)
                                .string("type", "list_issue_types로 확인한 업무 유형 이름이나 코드", false)
                                .string("column", "옮길 칸 이름", false)
                                .choice("status", "옮길 상태 분류 (그 분류의 첫 칸)", STATUSES.subList(3, 8), false)
                                .choice("priority", "우선순위", PRIORITIES, false)
                                .string("assignee", "담당자: me, none, 또는 구성원 이름", false)
                                .strings("labels", "라벨 이름 목록 (빈 목록이면 모두 뗌)", false)
                                .string("start_date", "시작일 YYYY-MM-DD 또는 none", false)
                                .string("due_date", "기한 YYYY-MM-DD 또는 none", false)
                                .number("estimate_hours", "추정시간(시간). 0이면 비움", 0, 1000, false)
                                .choice("story_points", "스토리 포인트 또는 none", STORY_POINTS_OR_NONE, false)
                                .string("cycle", "사이클 이름, current(진행 중인 사이클) 또는 none", false)
                                .string("parent", "상위 이슈 참조 또는 none", false)
                                .string("comment", "진행·결과 보고. 완료: 한 일·검증·남은 일, 취소: 취소 이유 (10000자까지)", false),
                        (actor, arguments) -> new org.springframework.transaction.support.TransactionTemplate(
                                        transactionManager)
                                .execute(status -> update(actor, arguments))),
                McpTool.read(
                        "list_cycles",
                        "사이클 보기",
                        "프로젝트의 사이클(스프린트)을 이른 것부터: 이름, 기간, 상태(upcoming·current·ended·completed), 목표, 업무 수·완료 수, 스토리 포인트(전체·완료), 추정·소요 시간. 업무를 사이클에 넣을 때는 create_issue·update_issue의 cycle로 이름을 줍니다.",
                        McpTool.input().string("project", "프로젝트 키", true),
                        (actor, arguments) -> listCycles(actor, arguments.string("project"))),
                McpTool.write(
                        "log_time",
                        "소요시간 기록",
                        "이슈에 들인 시간을 남깁니다(토큰 주인의 기록). 작업을 마치거나 하루를 정리할 때 실제로 쓴 시간만 적고 지어내지 않습니다. 추정시간 대비 실적과 스프린트 집계에 쓰입니다.",
                        McpTool.input()
                                .string("ref", "이슈 참조", true)
                                .number("hours", "쓴 시간(시간, 0.25 = 15분, 하루 24시간까지)", 0.02, 24, true)
                                .string("date", "일한 날 YYYY-MM-DD (생략: 오늘)", false)
                                .string("note", "무엇을 했는지 한 줄 (200자까지)", false),
                        (actor, arguments) -> logTime(actor, arguments)),
                McpTool.write(
                        "comment_issue",
                        "이슈에 댓글",
                        "이슈에 댓글을 남깁니다(일반 텍스트, 10000자까지). 진행 상황, 결과(커밋·검증), 결정(맥락 / 결정 / 검토한 대안)을 남길 때 씁니다.",
                        McpTool.input()
                                .string("ref", "이슈 참조", true)
                                .string("body", "댓글 내용", true)
                                .string("reply_to", "답글이면 그 댓글의 id (get_issue 타임라인의 id)", false)
                                .string("quote", "본문의 어느 글에 다는 댓글이면 그 글", false),
                        (actor, arguments) -> {
                            var issue = issueService
                                    .getByRef(actor, arguments.string("ref"))
                                    .issue();
                            String body = arguments.text("body").orElse("");
                            issueCommentService.add(
                                    actor,
                                    issue.projectKey(),
                                    issue.number(),
                                    new IssueCommentRequests.CommentInput(
                                            body,
                                            arguments.optionalString("quote").orElse(null),
                                            arguments
                                                    .optionalString("reply_to")
                                                    .map(IssueMcpTools::commentId)
                                                    .orElse(null)));
                            return Map.of("ref", issue.ref(), "commented", true);
                        }),
                McpTool.write(
                        "set_issue_body",
                        "이슈 본문 쓰기",
                        "이슈 본문을 Markdown(CommonMark + GFM 표·체크 목록·취소선)으로 통째로 바꿉니다. 제목은 ####까지, ```mermaid는 다이어그램, > [!NOTE] 인용은 콜아웃이 됩니다. 바꾸기 전 본문과 새 본문이 모두 버전으로 남아 화면에서 되돌릴 수 있습니다. 먼저 get_issue로 지금 본문을 읽고 고친 전체를 주세요. 지원 문법: ##~#### 제목, 목록·체크·표·코드·인용, > [!NOTE|TIP|IMPORTANT|WARNING|CAUTION], <details><summary>제목</summary> 뒤 빈 줄과 본문·닫기 태그, mermaid·math 펜스, <span data-color>·<mark data-color>, 링크 카드 <https://…>, 독립 문단의 ![설명](attachment:id)·[이름](attachment:id). 파일은 prepare_file_upload로 올립니다. <!-- block:id --> 표시는 유지하고 명시적으로 삭제할 때만 drop_blocks에 ID를 줍니다.",
                        McpTool.input()
                                .string("ref", "이슈 참조", true)
                                .string("markdown", "새 본문 전체 (확장 Markdown)", true)
                                .strings("drop_blocks", "명시적으로 삭제할 보존 블록 id. 나머지 <!-- block:id --> 표시는 유지하세요", false),
                        (actor, arguments) -> {
                            var issue = issueService
                                    .getByRef(actor, arguments.string("ref"))
                                    .issue();
                            var state = issueBodyService.replace(
                                    actor,
                                    issue.projectKey(),
                                    issue.number(),
                                    richBodyFacade.fromMarkdown(
                                            arguments.text("markdown").orElse("")),
                                    arguments.strings("drop_blocks").orElse(List.of()));
                            return Map.of("ref", issue.ref(), "bodyVersion", state.version());
                        }));
    }

    private Map<String, Object> board(CurrentUser actor, String key) {
        var view = new LinkedHashMap<String, Object>();
        view.put(
                "columns",
                boardService.columns(actor, key).stream()
                        .map(column -> Map.of("name", column.name(), "category", word(column.category())))
                        .toList());
        view.put(
                "labels",
                labelService.labels().stream()
                        .map(label -> Map.of("name", label.name(), "color", label.color()))
                        .toList());
        return view;
    }

    private Object list(CurrentUser actor, McpArguments arguments) {
        var key = arguments.optionalString("project");
        // An unknown project is not found, as on the screen, rather than an empty list.
        key.ifPresent(each -> issueProjects.readable(actor, each));
        var columnIds = new ArrayList<UUID>();
        var labelIds = new ArrayList<UUID>();
        if (arguments.has("column"))
            columnIds.add(column(boardService.columns(actor, required(key, "column")), arguments.string("column"))
                    .id());
        if (arguments.has("label")) labelIds.addAll(labels(labelService.labels(), List.of(arguments.string("label"))));
        String status = arguments
                .optionalString("status")
                .map(text -> text.toLowerCase(Locale.ROOT))
                .orElse("open");
        List<ColumnCategory> categories = columnIds.isEmpty() ? categories(status) : List.of();
        var assignee = arguments.optionalString("assignee").map(value -> assigneeFilter(actor, value));
        var sort = arguments.choice("sort", IssueRequests.Sort.class).orElse(IssueRequests.Sort.UPDATED);
        if (sort == IssueRequests.Sort.BOARD) required(key, "sort=board");
        var listing = new IssueRequests.Listing(
                key.map(List::of).orElse(List.of()),
                columnIds,
                categories,
                assignee.map(List::of).orElse(List.of()),
                labelIds,
                arguments
                        .optionalString("type")
                        .map(typeService::codeOf)
                        .map(List::of)
                        .orElse(List.of()),
                arguments.choice("priority", IssuePriority.class).map(List::of).orElse(List.of()),
                arguments
                        .optionalString("cycle")
                        .map(value -> cycleFilter(actor, key, value))
                        .map(List::of)
                        .orElse(List.of()),
                arguments.optionalString("q").orElse(null),
                null,
                sort,
                null,
                arguments.optionalString("cursor").orElse(null),
                Math.clamp(arguments.integer("size", 30), 1, 100));
        var since = arguments.optionalString("updated_since").map(IssueMcpTools::moment);
        if (since.isPresent() && sort != IssueRequests.Sort.UPDATED)
            throw new IllegalArgumentException("updated_since는 sort=updated(기본)와 함께 씁니다.");
        var slice = issueService.listAll(actor, listing);
        var items = slice.items().stream()
                .filter(issue -> since.isEmpty() || issue.updatedAt().isAfter(since.get()))
                .toList();
        boolean ended = items.size() < slice.items().size();
        var view = new LinkedHashMap<String, Object>();
        view.put("items", items.stream().map(this::compact).toList());
        if (slice.nextCursor() != null && !ended) view.put("nextCursor", slice.nextCursor());
        return view;
    }

    /** An issue as lists show it: its ref, title, where it stands, who has it, its labels and when it changed. */
    private LinkedHashMap<String, Object> compact(IssueViews.IssueRow issue) {
        var view = new LinkedHashMap<String, Object>();
        view.put("ref", issue.ref());
        view.put("title", issue.title());
        view.put("status", issue.columnName());
        view.put("category", word(issue.category()));
        view.put("type", typeService.nameOf(issue.type()));
        if (issue.priority() != null && issue.priority() != IssuePriority.NONE)
            view.put("priority", word(issue.priority()));
        if (issue.assigneeName() != null) view.put("assignee", issue.assigneeName());
        if (!issue.labels().isEmpty())
            view.put(
                    "labels",
                    issue.labels().stream().map(IssueViews.LabelChip::name).toList());
        if (issue.dueDate() != null) view.put("dueDate", issue.dueDate());
        view.put("updatedAt", issue.updatedAt());
        return view;
    }

    private static Instant moment(String text) {
        try {
            return Instant.parse(text);
        } catch (DateTimeParseException notInstant) {
            try {
                return LocalDate.parse(text).atStartOfDay(ZoneOffset.UTC).toInstant();
            } catch (DateTimeParseException notDay) {
                throw new IllegalArgumentException("updated_since는 ISO 시각이나 YYYY-MM-DD여야 합니다.");
            }
        }
    }

    @Override
    public String kind() {
        return "issues";
    }

    @Override
    @Transactional(readOnly = true)
    public Changes changesSince(
            CurrentUser actor, Instant since, Instant until, String project, int limit, String cursor) {
        if (project != null && project.equalsIgnoreCase("shared")) return new Changes(List.of(), null);
        var slice = issueService.changes(actor, project, since, until, cursor, limit);
        var items = new ArrayList<Map<String, Object>>();
        for (var row : slice.rows()) {
            if (row.deletedAt() != null)
                items.add(Map.of(
                        "ref",
                        row.projectKey() + "-" + row.number(),
                        "change",
                        "deleted",
                        "deletedAt",
                        row.deletedAt()));
            else {
                var item = compact(issueService
                        .getByRef(actor, row.projectKey() + "-" + row.number())
                        .issue());
                item.put("change", row.createdAt().isAfter(since) ? "created" : "changed");
                items.add(item);
            }
        }
        return new Changes(items, slice.nextCursor());
    }

    private Object get(CurrentUser actor, McpArguments arguments) {
        var found = issueService.getByRef(actor, arguments.string("ref"));
        var issue = found.issue();
        var view = row(issue);
        view.put("parent", found.parent() == null ? null : found.parent().ref());
        view.put(
                "children",
                found.children().stream()
                        .map(child ->
                                Map.of("ref", child.ref(), "title", child.title(), "category", word(child.category())))
                        .toList());
        view.put("createdBy", found.createdByName());
        view.put("canWrite", found.canWrite());
        var body = issueBodyService.read(actor, issue.projectKey(), issue.number());
        String markdown = RichBodyMarkdown.toMarkdown(body.body());
        boolean cut = markdown.length() > BODY_SHOWN;
        view.put("body", cut ? markdown.substring(0, BODY_SHOWN) : markdown);
        view.put("bodyTruncated", cut);
        view.put("bodyVersion", body.version());
        if (arguments.bool("include_timeline").orElse(true)) {
            var timeline = issueService.timeline(actor, issue.projectKey(), issue.number());
            int end = arguments
                    .optionalString("timeline_before")
                    .map(IssueMcpTools::position)
                    .map(at -> Math.min(at, timeline.size()))
                    .orElse(timeline.size());
            int start = Math.max(0, end - Math.clamp(arguments.integer("timeline_size", TIMELINE_SHOWN), 1, 100));
            view.put(
                    "timeline",
                    timeline.subList(start, end).stream()
                            .map(IssueMcpTools::entry)
                            .toList());
            view.put("timelineTotal", timeline.size());
            if (start > 0) view.put("timelineCursor", String.valueOf(start));
        }
        return view;
    }

    private Object create(CurrentUser actor, McpArguments arguments) {
        String key = arguments.string("project");
        var columns = boardService.columns(actor, key);
        var labels = labelService.labels();
        UUID columnId =
                target(columns, arguments).map(BoardViews.ColumnView::id).orElse(null);
        var request = new IssueRequests.CreateIssue(
                arguments.string("title"),
                arguments.optionalString("type").map(typeService::codeOf).orElse(null),
                columnId,
                arguments.choice("priority", IssuePriority.class).orElse(null),
                arguments
                        .optionalString("assignee")
                        .map(value -> person(actor, value))
                        .orElse(null),
                arguments.date("start_date").orElse(null),
                arguments.date("due_date").orElse(null),
                arguments
                        .optionalString("parent")
                        .map(ref -> parent(actor, ref))
                        .orElse(null),
                Set.copyOf(labels(labels, arguments.strings("labels").orElse(List.of()))),
                arguments.number("estimate_hours").orElse(null),
                arguments.optionalString("story_points").map(Double::valueOf).orElse(null),
                arguments
                        .optionalString("cycle")
                        .map(value -> cycleId(actor, key, value))
                        .orElse(null));
        long number = issueService.create(actor, key, request);
        var created = issueService.get(actor, key, number).issue();
        var markdown = arguments.text("body");
        if (markdown.isPresent() && !markdown.get().isBlank())
            issueBodyService.replace(actor, created.projectKey(), number, richBodyFacade.fromMarkdown(markdown.get()));
        return row(created);
    }

    private Object update(CurrentUser actor, McpArguments arguments) {
        var issue = issueService.getByRef(actor, arguments.string("ref")).issue();
        String key = issue.projectKey();
        var columns = arguments.has("column") || arguments.has("status") ? boardService.columns(actor, key) : null;
        UUID columnId = columns == null
                ? issue.columnId()
                : target(columns, arguments).map(BoardViews.ColumnView::id).orElse(issue.columnId());
        Set<UUID> labelIds = arguments
                .strings("labels")
                .map(names -> (Set<UUID>) new LinkedHashSet<>(labels(labelService.labels(), names)))
                .orElseGet(() -> issue.labels().stream()
                        .map(IssueViews.LabelChip::id)
                        .collect(Collectors.toCollection(LinkedHashSet::new)));
        UUID assigneeId = arguments.has("assignee")
                ? arguments.cleared("assignee") ? null : person(actor, arguments.string("assignee"))
                : issue.assigneeId();
        UUID parentId = arguments.has("parent")
                ? arguments.cleared("parent") ? null : parent(actor, arguments.string("parent"))
                : issue.parentId();
        var request = new IssueRequests.EditIssue(
                issue.version(),
                arguments.optionalString("title").orElse(issue.title()),
                arguments.optionalString("type").map(typeService::codeOf).orElse(issue.type()),
                columnId,
                arguments.choice("priority", IssuePriority.class).orElse(issue.priority()),
                assigneeId,
                day(arguments, "start_date", issue.startDate()),
                day(arguments, "due_date", issue.dueDate()),
                parentId,
                labelIds,
                arguments
                        .number("estimate_hours")
                        .map(hours -> hours <= 0 ? null : hours)
                        .orElse(arguments.has("estimate_hours") ? null : issue.estimateHours()),
                arguments.has("story_points")
                        ? arguments.cleared("story_points") ? null : Double.valueOf(arguments.string("story_points"))
                        : issue.storyPoints(),
                arguments.has("cycle")
                        ? arguments.cleared("cycle") ? null : cycleId(actor, key, arguments.string("cycle"))
                        : issue.cycleId());
        issueService.edit(actor, key, issue.number(), request);
        arguments
                .text("comment")
                .ifPresent(comment -> issueCommentService.add(
                        actor, key, issue.number(), new IssueCommentRequests.CommentInput(comment, null, null)));
        return row(issueService.get(actor, key, issue.number()).issue());
    }

    private Object logTime(CurrentUser actor, McpArguments arguments) {
        var issue = issueService.getByRef(actor, arguments.string("ref")).issue();
        timeEntryService.log(
                actor,
                issue.projectKey(),
                issue.number(),
                new TimeEntryModels.Log(
                        arguments.number("hours").orElseThrow(() -> new IllegalArgumentException("hours가 필요합니다.")),
                        arguments.date("date").orElse(null),
                        arguments.text("note").orElse(null)));
        return row(issueService.get(actor, issue.projectKey(), issue.number()).issue());
    }

    private Object listCycles(CurrentUser actor, String key) {
        return Map.of(
                "cycles",
                cycleService.list(actor, key).cycles().stream()
                        .map(cycle -> {
                            var view = new LinkedHashMap<String, Object>();
                            view.put("name", cycle.name());
                            view.put("state", word(cycle.state()));
                            view.put("startDate", cycle.startDate());
                            view.put("endDate", cycle.endDate());
                            if (cycle.goal() != null) view.put("goal", cycle.goal());
                            var totals = cycle.totals();
                            view.put("workItems", totals.workItems());
                            view.put("completed", totals.completed());
                            view.put("storyPoints", totals.storyPoints());
                            view.put("completedStoryPoints", totals.completedStoryPoints());
                            view.put("estimateHours", totals.estimateHours());
                            view.put("spentHours", totals.spentHours());
                            return view;
                        })
                        .toList());
    }

    /** A cycle of the project by its name, or current (the one under way). */
    private UUID cycleId(CurrentUser actor, String key, String value) {
        var cycles = cycleService.list(actor, key).cycles();
        String wanted = value.strip();
        var found = wanted.equalsIgnoreCase("current")
                ? cycles.stream()
                        .filter(cycle -> cycle.state() == Cycle.State.CURRENT)
                        .findFirst()
                : cycles.stream()
                        .filter(cycle -> cycle.name().equalsIgnoreCase(wanted))
                        .findFirst();
        return found.map(CycleModels.View::id)
                .orElseThrow(() -> new IllegalArgumentException(
                        wanted.equalsIgnoreCase("current")
                                ? "진행 중인 사이클이 없습니다. list_cycles로 확인하세요."
                                : "사이클 '" + wanted + "'을 찾을 수 없습니다. 사이클: "
                                        + cycles.stream()
                                                .map(CycleModels.View::name)
                                                .collect(Collectors.joining(", "))));
    }

    /** A list's cycle filter: current, none, or a cycle's name (a project is needed for a name). */
    private String cycleFilter(CurrentUser actor, Optional<String> key, String value) {
        String wanted = value.strip();
        if (wanted.equalsIgnoreCase("current") || wanted.equalsIgnoreCase("none"))
            return wanted.toLowerCase(Locale.ROOT);
        return cycleId(actor, required(key, "cycle"), wanted).toString();
    }

    /** The column a call names, by name or by status category (that category's first column). */
    private static Optional<BoardViews.ColumnView> target(List<BoardViews.ColumnView> columns, McpArguments arguments) {
        if (arguments.has("column")) return Optional.of(column(columns, arguments.string("column")));
        return arguments.optionalString("status").map(status -> {
            var category = ColumnCategory.valueOf(status.toUpperCase(Locale.ROOT));
            return columns.stream()
                    .filter(column -> column.category() == category)
                    .findFirst()
                    .orElseThrow(() ->
                            new IllegalArgumentException("이 프로젝트에는 " + status + " 분류의 칸이 없습니다. 칸: " + names(columns)));
        });
    }

    private static BoardViews.ColumnView column(List<BoardViews.ColumnView> columns, String name) {
        return columns.stream()
                .filter(column -> column.name().equalsIgnoreCase(name.strip()))
                .findFirst()
                .orElseThrow(
                        () -> new IllegalArgumentException("'" + name + "' 칸이 없습니다. 이 프로젝트의 칸: " + names(columns)));
    }

    private static List<UUID> labels(List<LabelViews.LabelView> labels, List<String> names) {
        var ids = new ArrayList<UUID>();
        for (String name : names)
            ids.add(labels.stream()
                    .filter(label -> label.name().equalsIgnoreCase(name.strip()))
                    .findFirst()
                    .map(LabelViews.LabelView::id)
                    .orElseThrow(() -> new IllegalArgumentException("'" + name + "' 라벨이 없습니다. 있는 라벨: "
                            + (labels.isEmpty()
                                    ? "(없음)"
                                    : labels.stream()
                                            .map(LabelViews.LabelView::name)
                                            .collect(Collectors.joining(", "))))));
        return ids;
    }

    /** The list filter's value for an assignee: me, none or a member's id. */
    private String assigneeFilter(CurrentUser actor, String value) {
        if (value.equalsIgnoreCase("me") || value.equalsIgnoreCase(McpArguments.NONE)) return value;
        return person(actor, value).toString();
    }

    /** A member named by an agent: me, their id, or their name as the screens show it, which must be one person's. */
    private UUID person(CurrentUser actor, String value) {
        if (value.equalsIgnoreCase("me")) return actor.id();
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException notId) {
            var matching = userFacade.activeNames().entrySet().stream()
                    .filter(entry -> entry.getValue().strip().equalsIgnoreCase(value.strip()))
                    .map(Map.Entry::getKey)
                    .toList();
            if (matching.size() == 1) return matching.getFirst();
            if (matching.isEmpty()) throw new IllegalArgumentException("'" + value + "'라는 구성원을 찾지 못했습니다.");
            throw new IllegalArgumentException("'" + value + "'라는 구성원이 여럿입니다. 구성원 id로 주세요: "
                    + matching.stream().map(UUID::toString).collect(Collectors.joining(", ")));
        }
    }

    /** The parent an agent names by reference; the service refuses one of another project. */
    private UUID parent(CurrentUser actor, String ref) {
        return issueService.getByRef(actor, ref).issue().id();
    }

    private static LocalDate day(McpArguments arguments, String name, LocalDate current) {
        if (!arguments.has(name)) return current;
        return arguments.cleared(name) ? null : arguments.date(name).orElse(current);
    }

    private static String required(Optional<String> key, String what) {
        return key.orElseThrow(() -> new IllegalArgumentException(what + "을 쓰려면 project도 주세요."));
    }

    private static List<ColumnCategory> categories(String status) {
        return switch (status) {
            case "open" -> List.of(ColumnCategory.BACKLOG, ColumnCategory.UNSTARTED, ColumnCategory.STARTED);
            case "closed" -> List.of(ColumnCategory.COMPLETED, ColumnCategory.CANCELED);
            case "all" -> List.of();
            default -> List.of(ColumnCategory.valueOf(status.toUpperCase(Locale.ROOT)));
        };
    }

    private static String names(List<BoardViews.ColumnView> columns) {
        return columns.isEmpty()
                ? "(아직 없음)"
                : columns.stream().map(BoardViews.ColumnView::name).collect(Collectors.joining(", "));
    }

    private LinkedHashMap<String, Object> row(IssueViews.IssueRow issue) {
        var view = new LinkedHashMap<String, Object>();
        view.put("ref", issue.ref());
        view.put("project", issue.projectKey());
        view.put("title", issue.title());
        view.put("type", typeService.nameOf(issue.type()));
        view.put("column", issue.columnName());
        view.put("category", word(issue.category()));
        view.put("priority", word(issue.priority()));
        view.put("assignee", issue.assigneeName());
        view.put("startDate", issue.startDate());
        view.put("dueDate", issue.dueDate());
        if (issue.estimateHours() != null) view.put("estimateHours", issue.estimateHours());
        if (issue.storyPoints() != null) view.put("storyPoints", issue.storyPoints());
        if (issue.spentHours() > 0) view.put("spentHours", issue.spentHours());
        if (issue.cycleName() != null) view.put("cycle", issue.cycleName());
        view.put(
                "labels",
                issue.labels().stream().map(IssueViews.LabelChip::name).toList());
        view.put("childCount", issue.childCount());
        view.put("updatedAt", issue.updatedAt());
        view.put("path", "/workspace/projects/" + issue.projectKey() + "/work-items/" + issue.number());
        return view;
    }

    private static UUID commentId(String value) {
        try {
            return UUID.fromString(value.strip());
        } catch (IllegalArgumentException wrong) {
            throw new IllegalArgumentException("reply_to는 댓글 id(UUID)여야 합니다.");
        }
    }

    private static int position(String cursor) {
        try {
            return Math.max(0, Integer.parseInt(cursor.strip()));
        } catch (NumberFormatException wrong) {
            throw new IllegalArgumentException("timeline_before는 앞 응답의 timelineCursor여야 합니다.");
        }
    }

    private static Map<String, Object> entry(IssueViews.TimelineEntry entry) {
        var view = new LinkedHashMap<String, Object>();
        view.put("at", entry.at());
        view.put("by", entry.actorName());
        if (entry.agent() != null) view.put("agent", entry.agent());
        if (entry.kind() == IssueViews.TimelineKind.COMMENT) {
            view.put("id", entry.id());
            view.put("comment", entry.body());
            if (entry.quote() != null) view.put("quote", entry.quote());
            if (entry.parentId() != null) view.put("replyTo", entry.parentId());
            if (entry.editedAt() != null) view.put("edited", true);
        } else {
            view.put("change", entry.field() == null ? null : word(entry.field()));
            if (entry.field() != IssueActivity.Field.CREATED) {
                view.put("before", entry.before());
                view.put("after", entry.after());
            }
        }
        return view;
    }

    private static String word(Enum<?> value) {
        return value == null ? null : value.name().toLowerCase(Locale.ROOT);
    }
}

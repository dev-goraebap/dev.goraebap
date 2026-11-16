package xyz.goraebap.workspace.document.application;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import xyz.goraebap.workspace.WorkspaceTransactional;
import xyz.goraebap.foundation.mcp.McpArguments;
import xyz.goraebap.foundation.mcp.McpChangeSource;
import xyz.goraebap.foundation.mcp.McpTool;
import xyz.goraebap.foundation.mcp.McpToolProvider;
import xyz.goraebap.workspace.activity.ActivityEntry;
import xyz.goraebap.workspace.document.application.activity.BodyActivityRequests;
import xyz.goraebap.workspace.document.application.activity.BodyActivityViews;
import xyz.goraebap.workspace.document.application.body.DocumentBodyService;
import xyz.goraebap.workspace.document.application.document.DocumentRequests;
import xyz.goraebap.workspace.document.application.document.DocumentService;
import xyz.goraebap.workspace.document.application.document.DocumentViews;
import xyz.goraebap.workspace.document.domain.document.Document;
import xyz.goraebap.workspace.richbody.RichBodyFacade;
import xyz.goraebap.workspace.richbody.RichBodyMarkdown;
import xyz.goraebap.workspace.richbody.RichBodyState;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/** Project pages and their versioned rich bodies, through the same services as the product screens. */
@Component
@RequiredArgsConstructor
public class DocumentMcpTools implements McpToolProvider, McpChangeSource {
    /** The longest body an agent reads at once; past it the text is cut and says so. */
    static final int BODY_SHOWN = 30_000;

    /** How an agent names the shared space (공용) where a project's key would go. */
    static final String SHARED = "shared";

    /** How many places a search shows in each document it found. */
    static final int SNIPPETS = 3;

    /** How many timeline entries get_document shows at once, the latest, as get_issue does. */
    static final int TIMELINE_SHOWN = 10;

    private static final List<String> SORTS = List.of("updated", "created", "title");

    private final DocumentService documentService;
    private final DocumentBodyService documentBodyService;
    private final DocumentSpaces documentSpaces;
    private final RichBodyFacade richBodyFacade;
    private final org.springframework.transaction.PlatformTransactionManager transactionManager;
    private final Clock clock;
    private final jakarta.validation.Validator validator;
    private final xyz.goraebap.workspace.document.application.library.LibraryService libraryService;

    @Override
    public List<McpTool> tools() {
        return List.of(
                McpTool.read(
                        "list_documents",
                        "문서 찾기",
                        "프로젝트 문서를 찾습니다. project를 생략하면 모든 프로젝트를 검색합니다. q는 제목과 본문 검색, sort는 정렬입니다. nextCursor를 cursor로 주어 계속 읽습니다. 라벨·뷰·모음 계층은 get_document_library로 읽습니다.",
                        McpTool.input()
                                .string("project", "프로젝트 키. 없으면 모든 프로젝트", false)
                                .string("q", "제목이나 본문의 말", false)
                                .choice("sort", "정렬 (기본 updated, title은 가나다순)", SORTS, false)
                                .integer("size", "한 번에 볼 개수 (기본 30)", 1, 100)
                                .string("cursor", "앞 응답의 nextCursor", false),
                        this::list),
                McpTool.read(
                        "get_document",
                        "문서 보기",
                        "문서 하나를 id로 돌려줍니다: 제목, 프로젝트 키, 요약, Markdown 본문 전체, 만든 사람과 마지막으로 쓴 사람 · 시각, bodyVersion, 그리고 댓글과 활동 중 최근 것(기본 10개, 오래된 순; 댓글은 id, 인용한 본문 글, 답글 대상도). 더 앞의 활동은 timelineCursor를 timeline_before로 주세요. 긴 문서는 get_document_outline으로 목차를 본 뒤 get_document_section으로 필요한 절만 읽으세요.",
                        McpTool.input()
                                .string("id", "문서 id (list_documents의 id)", true)
                                .bool("include_timeline", "댓글과 활동도 함께 볼지 (기본 true)")
                                .integer("timeline_size", "볼 활동 수 (기본 10)", 1, 100)
                                .string("timeline_before", "앞 응답의 timelineCursor", false),
                        (actor, arguments) -> get(actor, document(arguments), arguments)),
                McpTool.write(
                        "comment_document",
                        "문서에 댓글",
                        "문서에 댓글을 남깁니다(일반 텍스트, 10000자까지). 문서 댓글로 받은 요청을 반영했으면 reply_to에 그 댓글의 id를 주어 답글로 결과를 남기세요. 화면에서 댓글을 쓸 수 있는 문서에만 쓸 수 있습니다.",
                        McpTool.input()
                                .string("id", "문서 id", true)
                                .string("body", "댓글 내용", true)
                                .string("reply_to", "답글이면 그 댓글의 id (get_document 타임라인의 id)", false)
                                .string("quote", "본문의 어느 글에 다는 댓글이면 그 글", false),
                        this::comment),
                McpTool.write(
                        "create_document",
                        "문서 만들기",
                        "프로젝트에 문서를 만듭니다. parent_id를 주면 그 페이지 아래에 만듭니다. 하위 페이지에는 label_ids를 지정하지 마세요. 생성 전에 같은 부모의 기존 페이지를 조회해 중복을 피하세요. 폴더와 별도 매뉴얼 종류는 지원하지 않습니다. 문서와 하위 페이지마다 내용에 맞는 표식(icon·color)을 고르면 문서 트리에서 구분하기 쉽습니다(형제 페이지끼리 같은 계열로 맞추면 좋습니다). 지원 문법: ##~#### 제목, 목록·체크·표·코드·인용, > [!NOTE|TIP|IMPORTANT|WARNING|CAUTION], <details><summary>제목</summary> 뒤 빈 줄과 본문·닫기 태그, mermaid·math 펜스, <span data-color>·<mark data-color>, 링크 카드 <https://…>, 독립 문단의 ![설명](attachment:id)·[이름](attachment:id). 파일은 prepare_file_upload로 올립니다. <!-- block:id --> 표시는 유지하고 명시적으로 삭제할 때만 drop_blocks에 ID를 줍니다.",
                        McpTool.input()
                                .string("project", "프로젝트 키", true)
                                .string("title", "제목 (200자까지)", true)
                                .string("markdown", "본문 (Markdown)", false)
                                .string("parent_id", "상위 페이지 UUID. 생략하면 최상위", false)
                                .strings("label_ids", "최상위 문서에 지정할 문서 라벨 UUID 목록", false)
                                .string(
                                        "icon",
                                        "표식 아이콘. 화면의 표식 이름(document, book, wiki, code, tasks, idea, shield, milestone, decision, workflow, component, release, people, calendar, tag 등) 또는 Solar 아이콘 's:이름'(예: s:rocket). 생략하면 문서 아이콘",
                                        false)
                                .string("color", "표식 색 #RRGGBB (예: #4f7cff). 생략하면 기본색", false),
                        (actor, arguments) -> new org.springframework.transaction.support.TransactionTemplate(
                                        transactionManager)
                                .execute(status -> create(actor, arguments))),
                McpTool.write(
                        "update_document",
                        "문서 고치기",
                        "준 값만 바꿉니다. title은 제목을, markdown은 본문을 통째로 바꿉니다. 바꾸기 전 본문과 새 본문이 모두 버전으로 남아 화면에서 되돌릴 수 있습니다. 먼저 get_document로 지금 본문을 읽고 고친 전체를 주되, expectedVersion에 읽은 bodyVersion을 주면 그사이 바뀐 본문을 덮어쓰지 않습니다. 한 절만 고칠 때는 update_document_section을 쓰세요.",
                        McpTool.input()
                                .string("id", "문서 id", true)
                                .string("title", "새 제목", false)
                                .string("markdown", "새 본문 전체 (Markdown)", false)
                                .integer("expectedVersion", "읽은 bodyVersion (주면 그사이 바뀐 본문은 거절)", 0, Integer.MAX_VALUE)
                                .strings("drop_blocks", "명시적으로 삭제할 보존 블록 id. 나머지 <!-- block:id --> 표시는 유지하세요", false),
                        (actor, arguments) -> new org.springframework.transaction.support.TransactionTemplate(
                                        transactionManager)
                                .execute(status -> update(actor, arguments))),
                McpTool.read(
                        "get_document_outline",
                        "문서 목차",
                        "문서 하나의 목차를 돌려줍니다: 제목 · 공간 · 폴더 · 요약 · bodyVersion과, 본문의 제목(#)들을 나무로(각 절의 id, 제목, 단계, 글자 수). 첫 제목 앞 글은 _intro입니다. 긴 문서는 이것부터 보고 get_document_section으로 필요한 절만 읽으세요.",
                        McpTool.input().string("id", "문서 id", true),
                        (actor, arguments) -> outline(actor, document(arguments))),
                McpTool.read(
                        "get_document_section",
                        "문서의 한 절",
                        "문서 본문에서 한 절(제목부터 같은 단계 이상의 다음 제목 전까지, 하위 절 포함)만 Markdown으로 돌려줍니다. section은 목차의 id, 또는 제목(겹치면 '바깥 제목/제목' 경로)입니다. 고칠 때 쓸 bodyVersion도 함께 돌려줍니다.",
                        McpTool.input().string("id", "문서 id", true).string("section", "절 id 또는 제목 (경로는 /로)", true),
                        (actor, arguments) -> section(actor, arguments)),
                McpTool.write(
                        "update_document_section",
                        "문서의 한 절 고치기",
                        "문서 본문에서 한 절만 바꿉니다. markdown이 제목(#)으로 시작하면 제목까지 바꾸고, 아니면 제목은 두고 그 아래 내용만 바꿉니다. expectedVersion에는 get_document_section · get_document_outline에서 읽은 bodyVersion을 주세요. 그사이 이 절이 바뀌었으면 거절하니 다시 읽고 고치세요(다른 절의 변경은 막지 않습니다). 바꾸기 전과 뒤가 버전으로 남습니다.",
                        McpTool.input()
                                .string("id", "문서 id", true)
                                .string("section", "절 id 또는 제목 (경로는 /로)", true)
                                .string("markdown", "그 절의 새 Markdown", true)
                                .integer("expectedVersion", "읽은 bodyVersion", 0, Integer.MAX_VALUE)
                                .strings("drop_blocks", "명시적으로 삭제할 보존 블록 id. 나머지 <!-- block:id --> 표시는 유지하세요", false),
                        (actor, arguments) -> new org.springframework.transaction.support.TransactionTemplate(
                                        transactionManager)
                                .execute(status -> updateSection(actor, arguments))),
                McpTool.read(
                        "get_document_library",
                        "문서함 구성",
                        "프로젝트 문서용 라벨, 아이콘·색상을 가진 저장된 뷰와 페이지 순서를 읽습니다. pages의 parentId가 상위 페이지이며 order.version은 공통 순서 수정에 사용합니다.",
                        McpTool.input().string("project", "프로젝트 키", true),
                        (actor, arguments) -> libraryService.get(actor, arguments.string("project"))));
    }

    private Object list(CurrentUser actor, McpArguments arguments) {
        String key = arguments.optionalString("project").orElse(null);
        if (key != null && isShared(key)) throw new IllegalArgumentException("공용 문서함은 제거되었습니다. 프로젝트 키를 사용해 주세요.");
        var q = arguments.optionalString("q");
        var slice = documentService.list(
                actor,
                new DocumentRequests.Listing(
                        key,
                        false,
                        null,
                        false,
                        q.orElse(null),
                        arguments.choice("sort", DocumentRequests.Sort.class).orElse(null),
                        null,
                        arguments.optionalString("cursor").orElse(null),
                        Math.clamp(arguments.integer("size", 30), 1, 100)));
        var result = new LinkedHashMap<String, Object>();
        result.put(
                "items",
                slice.items().stream()
                        .map(row -> {
                            var item = compact(row, null);
                            String markdown = markdownOf(actor, row.id());
                            putSummary(item, markdown);
                            q.map(words -> MarkdownSections.snippets(markdown, words, SNIPPETS))
                                    .filter(found -> !found.isEmpty())
                                    .ifPresent(found -> item.put("matches", found));
                            return item;
                        })
                        .toList());
        if (slice.nextCursor() != null) result.put("nextCursor", slice.nextCursor());
        return result;
    }

    /** A document as lists show it: what it is, where, its summary and when it last changed, nothing empty. */
    private static LinkedHashMap<String, Object> compact(DocumentViews.DocumentRow document, String folder) {
        var view = new LinkedHashMap<String, Object>();
        view.put("id", document.id());
        view.put("title", document.title());
        view.put("space", document.projectKey() == null ? SHARED : document.projectKey());
        if (folder != null) view.put("folder", folder);
        if (document.kind() == Document.Kind.MANUAL) {
            view.put("kind", "manual");
            view.put("chapters", document.chapterCount());
        }
        var summary = MarkdownSections.summaryOf(document.excerpt());
        if (summary != null) view.put("summary", summary);
        view.put("updatedAt", document.updatedAt());
        view.put("version", document.version());
        if (document.parentId() != null) view.put("parentId", document.parentId());
        return view;
    }

    private static void putSummary(Map<String, Object> item, String markdown) {
        item.remove("summary");
        var summary = MarkdownSections.summaryOf(markdown);
        if (summary != null) item.put("summary", summary);
    }

    private String markdownOf(CurrentUser actor, UUID id) {
        return RichBodyMarkdown.toMarkdown(documentBodyService.read(actor, id).body());
    }

    private Object outline(CurrentUser actor, UUID id) {
        var found = documentService.get(actor, id);
        var body = documentBodyService.read(actor, id);
        String markdown = RichBodyMarkdown.toMarkdown(body.body());
        var view = compact(found.document(), folderPath(found));
        view.remove("version");
        view.put("bodyVersion", body.version());
        view.put("size", markdown.length());
        var summary = MarkdownSections.summaryOf(markdown);
        if (summary != null) view.put("summary", summary);
        view.put("sections", MarkdownSections.of(markdown).outline());
        return view;
    }

    private Object section(CurrentUser actor, McpArguments arguments) {
        UUID id = document(arguments);
        var body = documentBodyService.read(actor, id);
        var sections = MarkdownSections.of(RichBodyMarkdown.toMarkdown(body.body()));
        var section = sectionIn(sections, arguments.string("section"));
        var view = new LinkedHashMap<String, Object>();
        view.put("id", id);
        view.put("section", section.id());
        if (section.level() > 0) view.put("title", section.title());
        view.put("markdown", sections.text(section));
        view.put("bodyVersion", body.version());
        return view;
    }

    private Object updateSection(CurrentUser actor, McpArguments arguments) {
        UUID id = document(arguments);
        var body = documentBodyService.read(actor, id);
        String markdown = RichBodyMarkdown.toMarkdown(body.body());
        var sections = MarkdownSections.of(markdown);
        var section = sectionIn(sections, arguments.string("section"));
        String written = arguments.text("markdown").orElse("");
        var drops = arguments.strings("drop_blocks").orElse(List.of());
        var range = blocksOf(body.body(), section, markdown.length());
        RichBodyState saved;
        if (range != null) {
            // Only the section's blocks change, so a change elsewhere since it was read does not refuse it.
            Long expected = arguments.has("expectedVersion") ? (long) arguments.integer("expectedVersion", -1) : null;
            saved = documentBodyService.replaceBlocks(
                    actor,
                    id,
                    range.ids(),
                    range.after(),
                    richBodyFacade.fromMarkdown(sections.written(section, written)),
                    drops,
                    expected);
        } else {
            requireVersion(arguments, body.version());
            saved = documentBodyService.replace(
                    actor, id, richBodyFacade.fromMarkdown(sections.replace(section, written)), drops);
        }
        var view = new LinkedHashMap<String, Object>();
        view.put("id", id);
        view.put("section", section.id());
        view.put("bodyVersion", saved.version());
        return view;
    }

    /** The top-level blocks a section was written from (after: the block before them, null at the start). */
    record BlockRun(List<String> ids, String after) {}

    /**
     * The blocks that wrote a section of the body's Markdown, or null when the section does not start and end where
     * top-level blocks do (a heading inside a block): such a section is replaced in the whole body.
     */
    static BlockRun blocksOf(Map<String, Object> body, MarkdownSections.Section section, int length) {
        if (body == null || !(body.get("content") instanceof List<?> content)) return null;
        var starts = RichBodyMarkdown.blockStarts(body);
        int from = -1, to = content.size();
        for (int index = 0; index < starts.size(); index++) {
            int start = starts.get(index);
            if (start < 0) continue;
            if (from < 0 && start >= section.start()) {
                if (start != section.start()) return null;
                from = index;
            }
            if (start >= section.end()) {
                if (start != section.end()) return null;
                to = index;
                break;
            }
        }
        if (from < 0 || (to == content.size() && section.end() < length)) return null;
        var ids = new ArrayList<String>();
        for (Object node : content.subList(from, to)) {
            if (!(node instanceof Map<?, ?> map)
                    || !(map.get("attrs") instanceof Map<?, ?> attrs)
                    || !(attrs.get("blockId") instanceof String blockId)) return null;
            ids.add(blockId);
        }
        String after = null;
        if (from > 0) {
            if (!(content.get(from - 1) instanceof Map<?, ?> map)
                    || !(map.get("attrs") instanceof Map<?, ?> attrs)
                    || !(attrs.get("blockId") instanceof String blockId)) return null;
            after = blockId;
        }
        return new BlockRun(ids, after);
    }

    /** A write over a body read at expectedVersion is refused once the body has moved on, so nothing is overwritten. */
    private static void requireVersion(McpArguments arguments, long current) {
        if (!arguments.has("expectedVersion")) return;
        int expected = arguments.integer("expectedVersion", -1);
        if (expected != current)
            throw new IllegalArgumentException(
                    "본문이 그사이 바뀌었습니다 (읽은 버전 " + expected + ", 지금 " + current + "). 다시 읽고 고치세요.");
    }

    private static MarkdownSections.Section sectionIn(MarkdownSections sections, String name) {
        return sections.find(name)
                .orElseThrow(() ->
                        new IllegalArgumentException("'" + name + "' 절이 없거나 같은 제목이 여럿입니다. 절 id: " + sections.ids()));
    }

    @Override
    public String kind() {
        return "documents";
    }

    @Override
    @WorkspaceTransactional(readOnly = true)
    public Changes changesSince(
            CurrentUser actor, Instant since, Instant until, String project, int limit, String cursor) {
        String key = project == null || isShared(project) ? null : project;
        var slice =
                documentService.changes(actor, key, project != null && isShared(project), since, until, cursor, limit);
        var items = new ArrayList<Map<String, Object>>();
        for (var row : slice.rows()) {
            if (row.deletedAt() != null)
                items.add(Map.of(
                        "id",
                        row.id(),
                        "space",
                        row.projectKey() == null ? SHARED : row.projectKey(),
                        "change",
                        "deleted",
                        "deletedAt",
                        row.deletedAt()));
            else {
                var found = documentService.get(actor, row.id());
                var item = compact(found.document(), folderPath(found));
                putSummary(item, markdownOf(actor, row.id()));
                boolean written =
                        row.updatedAt().isAfter(since) && !row.updatedAt().isAfter(until);
                item.put("change", !written ? "commented" : row.createdAt().isAfter(since) ? "created" : "changed");
                if (row.commentedAt() != null) item.put("commentedAt", row.commentedAt());
                items.add(item);
            }
        }
        return new Changes(items, slice.nextCursor());
    }

    private Object get(CurrentUser actor, UUID id, McpArguments arguments) {
        var found = documentService.get(actor, id);
        var document = found.document();
        var view = row(document, folderPath(found));
        view.put("createdBy", document.createdByName());
        view.put("createdAt", document.createdAt());
        view.put("canWrite", found.canWrite());
        var body = documentBodyService.read(actor, id);
        String markdown = RichBodyMarkdown.toMarkdown(body.body());
        boolean cut = markdown.length() > BODY_SHOWN;
        var summary = MarkdownSections.summaryOf(markdown);
        if (summary != null) view.put("summary", summary);
        view.put("body", cut ? markdown.substring(0, BODY_SHOWN) : markdown);
        view.put("bodyTruncated", cut);
        view.put("bodyVersion", body.version());
        if (arguments.bool("include_timeline").orElse(true)) {
            var timeline = documentBodyService.timeline(actor, id);
            int end = arguments
                    .optionalString("timeline_before")
                    .map(DocumentMcpTools::position)
                    .map(at -> Math.min(at, timeline.size()))
                    .orElse(timeline.size());
            int start = Math.max(0, end - Math.clamp(arguments.integer("timeline_size", TIMELINE_SHOWN), 1, 100));
            view.put(
                    "timeline",
                    timeline.subList(start, end).stream()
                            .map(DocumentMcpTools::entry)
                            .toList());
            view.put("timelineTotal", timeline.size());
            if (start > 0) view.put("timelineCursor", String.valueOf(start));
        }
        return view;
    }

    /** A comment as the screen writes it: the same service, so the same grants, length and agent on the entry. */
    private Object comment(CurrentUser actor, McpArguments arguments) {
        UUID id = document(arguments);
        UUID commentId = documentBodyService.addComment(
                actor,
                id,
                new BodyActivityRequests.CommentInput(
                        arguments.text("body").orElse(""),
                        arguments.optionalString("quote").orElse(null),
                        arguments
                                .optionalString("reply_to")
                                .map(DocumentMcpTools::commentId)
                                .orElse(null)));
        return Map.of("id", id, "commentId", commentId, "commented", true);
    }

    private static UUID commentId(String value) {
        return uuid(value).orElseThrow(() -> new IllegalArgumentException("reply_to는 댓글 id(UUID)여야 합니다."));
    }

    private static int position(String cursor) {
        try {
            return Math.max(0, Integer.parseInt(cursor.strip()));
        } catch (NumberFormatException wrong) {
            throw new IllegalArgumentException("timeline_before는 앞 응답의 timelineCursor여야 합니다.");
        }
    }

    /** One timeline entry as get_issue shows it: a comment with its id, or a change by its field. */
    private static Map<String, Object> entry(BodyActivityViews.Entry entry) {
        var view = new LinkedHashMap<String, Object>();
        view.put("at", entry.at());
        if (entry.actorName() != null) view.put("by", entry.actorName());
        if (entry.agent() != null) view.put("agent", entry.agent());
        if (entry.kind() == ActivityEntry.Kind.COMMENT) {
            view.put("id", entry.id());
            view.put("comment", entry.body());
            if (entry.quote() != null) view.put("quote", entry.quote());
            if (entry.parentId() != null) view.put("replyTo", entry.parentId());
            if (entry.editedAt() != null) view.put("edited", true);
        } else {
            if (entry.field() != null) view.put("change", entry.field().toLowerCase(java.util.Locale.ROOT));
            if (entry.before() != null) view.put("before", entry.before());
            if (entry.after() != null) view.put("after", entry.after());
        }
        return view;
    }

    private Object create(CurrentUser actor, McpArguments arguments) {
        var input = new DocumentRequests.CreateDocument(
                arguments.string("project"),
                null,
                Document.Kind.PAGE,
                arguments.string("title"),
                arguments.optionalString("icon").orElse(null),
                arguments.optionalString("color").map(String::toLowerCase).orElse(null),
                null,
                arguments.text("markdown").orElse(null),
                arguments.strings("label_ids").orElse(List.of()).stream()
                        .map(UUID::fromString)
                        .toList(),
                arguments.optionalString("parent_id").map(UUID::fromString).orElse(null));
        var violations = validator.validate(input);
        if (!violations.isEmpty())
            throw new IllegalArgumentException("문서 입력을 확인해 주세요: "
                    + violations.stream()
                            .map(error -> error.getPropertyPath().toString())
                            .sorted()
                            .collect(java.util.stream.Collectors.joining(", ")));
        UUID id = documentService.create(actor, input);
        return summary(documentService.get(actor, id));
    }

    private Object update(CurrentUser actor, McpArguments arguments) {
        UUID id = document(arguments);
        var found = documentService.get(actor, id).document();
        var title = arguments.optionalString("title");
        if (title.isPresent() && !title.get().equals(found.title())) {
            documentService.rename(actor, id, new DocumentRequests.RenameDocument(found.version(), title.get()));
        }
        var markdown = arguments.text("markdown");
        if (markdown.isPresent()) {
            requireVersion(arguments, documentBodyService.read(actor, id).version());
            documentBodyService.replace(
                    actor,
                    id,
                    richBodyFacade.fromMarkdown(markdown.get()),
                    arguments.strings("drop_blocks").orElse(List.of()));
        }
        return summary(documentService.get(actor, id));
    }

    private static UUID document(McpArguments arguments) {
        return uuid(arguments.string("id")).orElseThrow(() -> new IllegalArgumentException("id는 문서 id(UUID)여야 합니다."));
    }

    private static Optional<UUID> uuid(String value) {
        try {
            return Optional.of(UUID.fromString(value.strip()));
        } catch (IllegalArgumentException notId) {
            return Optional.empty();
        }
    }

    private static boolean isShared(String value) {
        return value.equalsIgnoreCase(SHARED) || value.equals("공용");
    }

    private static Map<String, Object> summary(DocumentViews.DocumentView found) {
        var view = row(found.document(), folderPath(found));
        view.remove("excerpt");
        return view;
    }

    /** The folders down to an opened document, as a path of names; none at its space's top. */
    private static String folderPath(DocumentViews.DocumentView found) {
        return null;
    }

    private static String spaceName(DocumentSpaces.Space space) {
        return space.isShared() ? SHARED : space.projectKey();
    }

    /** A document as the tools show it, its folder as a path from its space's top (or by name when not known). */
    private static LinkedHashMap<String, Object> row(DocumentViews.DocumentRow document, String folder) {
        var view = new LinkedHashMap<String, Object>();
        view.put("id", document.id());
        view.put("title", document.title());
        view.put("space", document.projectKey() == null ? SHARED : document.projectKey());
        view.put("folder", folder);
        view.put("excerpt", document.excerpt());
        view.put("updatedBy", document.updatedByName());
        view.put("updatedAt", document.updatedAt());
        view.put("version", document.version());
        if (document.parentId() != null) view.put("parentId", document.parentId());
        view.put(
                "path",
                document.projectKey() == null
                        ? "/workspace/documents/" + document.id()
                        : "/workspace/projects/" + document.projectKey() + "/documents/" + document.id());
        return view;
    }
}

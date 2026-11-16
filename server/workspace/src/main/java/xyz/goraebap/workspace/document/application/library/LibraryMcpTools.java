package xyz.goraebap.workspace.document.application.library;

import jakarta.validation.Validator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import xyz.goraebap.foundation.mcp.McpArguments;
import xyz.goraebap.foundation.mcp.McpTool;
import xyz.goraebap.foundation.mcp.McpToolProvider;
import xyz.goraebap.workspace.document.application.document.DocumentService;
import xyz.goraebap.workspace.document.domain.library.LibraryState.Layout;
import xyz.goraebap.workspace.document.domain.library.LibraryState.Sort;

/** The same versioned library commands as the product screens, executed as the token owner. */
@Component
@RequiredArgsConstructor
public class LibraryMcpTools implements McpToolProvider {
    private final LibraryService library;
    private final DocumentLabelService labels;
    private final DocumentService documents;
    private final Validator validator;

    @Override
    public List<McpTool> tools() {
        return List.of(
                McpTool.write(
                        "create_document_label",
                        "문서 라벨 만들기",
                        "전체 프로젝트 공통 문서 라벨을 만듭니다. 업무 라벨과 별개이며 프로젝트 관리자만 가능합니다. 먼저 get_document_library로 같은 라벨이 있는지 확인하세요.",
                        McpTool.input().string("name", "라벨 이름", true).string("color", "#RRGGBB 색상", true),
                        (actor, args) -> {
                            var id = labels.create(
                                    actor,
                                    checked(new DocumentLabelModels.Input(args.string("name"), args.string("color"))));
                            return labels.list().stream()
                                    .filter(label -> label.id().equals(id))
                                    .findFirst()
                                    .orElseThrow();
                        }),
                McpTool.write(
                        "update_document_label",
                        "문서 라벨 수정",
                        "공통 문서 라벨의 이름과 색상을 수정합니다. 프로젝트 관리자 권한과 조회한 라벨 version이 필요합니다. 다른 문서에서도 같은 라벨이 바뀝니다.",
                        versioned()
                                .string("id", "라벨 UUID", true)
                                .string("name", "라벨 이름", true)
                                .string("color", "#RRGGBB 색상", true),
                        (actor, args) -> {
                            UUID id = id(args, "id");
                            labels.edit(
                                    actor,
                                    id,
                                    checked(new DocumentLabelModels.Edit(
                                            version(args), args.string("name"), args.string("color"))));
                            return labels.list().stream()
                                    .filter(label -> label.id().equals(id))
                                    .findFirst()
                                    .orElseThrow();
                        }),
                McpTool.write(
                        "set_document_labels",
                        "문서 라벨 지정",
                        "최상위 문서의 라벨 목록 전체를 바꿉니다. 기존 라벨을 보존하려면 함께 보내세요. 문서 쓰기 권한과 get_document의 version(본문 bodyVersion과 다름)이 필요합니다. 하위 페이지에는 라벨을 지정할 수 없습니다.",
                        versioned()
                                .string("project", "프로젝트 키", true)
                                .string("id", "문서 UUID", true)
                                .strings("label_ids", "문서 라벨 UUID 전체 목록. 빈 배열은 해제", true),
                        (actor, args) -> {
                            UUID id = id(args, "id");
                            library.assign(
                                    actor,
                                    args.string("project"),
                                    id,
                                    new LibraryModels.Labels(version(args), ids(args, "label_ids")));
                            var row = documents.get(actor, id).document();
                            return Map.of("id", id, "version", row.version());
                        }),
                viewTool(false),
                viewTool(true),
                McpTool.write(
                        "move_document",
                        "상위 페이지 변경",
                        "문서를 같은 프로젝트의 다른 페이지 아래로 이동합니다. parent_id=none이면 최상위입니다. 프로젝트 관리자 권한과 문서 version이 필요하며 순환 이동은 거절합니다. 하위로 이동하면 그 문서의 라벨은 해제됩니다.",
                        versioned()
                                .string("project", "프로젝트 키", true)
                                .string("id", "이동할 문서 UUID", true)
                                .string("parent_id", "상위 페이지 UUID 또는 none", true),
                        (actor, args) -> {
                            UUID id = id(args, "id");
                            library.parent(
                                    actor,
                                    args.string("project"),
                                    id,
                                    new LibraryModels.MovePage(
                                            version(args), args.cleared("parent_id") ? null : id(args, "parent_id")));
                            var row = documents.get(actor, id).document();
                            return Map.of("id", id, "version", row.version());
                        }),
                McpTool.write(
                        "set_document_order",
                        "페이지 순서 지정",
                        "같은 부모 아래 전체 페이지의 공통 순서를 저장합니다. 프로젝트 관리자만 가능하며 get_document_library의 order.version을 expectedVersion으로 줍니다. 다른 부모의 순서는 보존합니다.",
                        versioned()
                                .string("project", "프로젝트 키", true)
                                .string("parent_id", "상위 페이지 UUID 또는 none(최상위)", true)
                                .strings("ids", "같은 부모 아래 전체 문서 UUID를 원하는 순서로", true),
                        (actor, args) -> {
                            String key = args.string("project");
                            library.order(
                                    actor,
                                    key,
                                    new LibraryModels.SaveOrder(
                                            version(args),
                                            ids(args, "ids"),
                                            args.cleared("parent_id") ? null : id(args, "parent_id")));
                            return library.get(actor, key).order();
                        }));
    }

    private McpTool viewTool(boolean update) {
        var input = McpTool.input()
                .string("project", "프로젝트 키", true)
                .string("name", "뷰 이름", true)
                .strings("label_ids", "문서 라벨 UUID 목록. 여러 라벨은 OR, 빈 목록은 전체", true)
                .string("icon", "아이콘 이름", false)
                .string("color", "#RRGGBB 색상", false)
                .choice("layout", "보기 방식", List.of("grid", "list"), false)
                .choice("sort", "정렬", List.of("custom", "title", "updated", "created"), false)
                .choice("direction", "정렬 방향", List.of("asc", "desc"), false);
        if (update)
            input.string("id", "뷰 UUID", true)
                    .integer("expectedVersion", "읽은 뷰 version(필수)", 0, Integer.MAX_VALUE, true);
        return McpTool.write(
                update ? "update_document_view" : "create_document_view",
                update ? "문서 뷰 수정" : "문서 뷰 만들기",
                "프로젝트 관리자만 저장된 문서 뷰를 구성합니다. 이름·아이콘·색상·라벨·보기·정렬을 저장합니다. 검색어는 저장하지 않습니다. 수정은 속성 전체와 조회한 뷰 version이 필요합니다. 생성 전 같은 뷰가 있는지 확인하세요.",
                input,
                (actor, args) -> {
                    String key = args.string("project");
                    UUID id = library.view(
                            actor,
                            key,
                            update ? id(args, "id") : null,
                            checked(new LibraryModels.SaveView(
                                    update ? version(args) : null,
                                    args.string("name"),
                                    ids(args, "label_ids"),
                                    args.optionalString("icon").orElse(null),
                                    args.optionalString("color").orElse(null),
                                    args.choice("layout", Layout.class).orElse(Layout.GRID),
                                    args.choice("sort", Sort.class).orElse(Sort.CUSTOM),
                                    args.optionalString("direction")
                                            .orElse("asc")
                                            .toUpperCase(java.util.Locale.ROOT))));
                    return library.get(actor, key).views().stream()
                            .filter(view -> view.id().equals(id))
                            .findFirst()
                            .orElseThrow();
                });
    }

    private static McpTool.Input versioned() {
        return McpTool.input()
                .integer("expectedVersion", "읽은 대상 version(필수). bodyVersion과 다릅니다", 0, Integer.MAX_VALUE, true);
    }

    private static long version(McpArguments args) {
        if (!args.has("expectedVersion")) throw new IllegalArgumentException("expectedVersion이 필요합니다. 먼저 대상을 읽어 주세요.");
        return args.integer("expectedVersion", -1);
    }

    private static UUID id(McpArguments args, String key) {
        try {
            return UUID.fromString(args.string(key));
        } catch (IllegalArgumentException invalid) {
            throw new IllegalArgumentException(key + "는 UUID여야 합니다.");
        }
    }

    private static List<UUID> ids(McpArguments args, String key) {
        return args.strings(key).orElseThrow(() -> new IllegalArgumentException(key + " 목록이 필요합니다.")).stream()
                .map(value -> {
                    try {
                        return UUID.fromString(value);
                    } catch (IllegalArgumentException invalid) {
                        throw new IllegalArgumentException(key + "에는 UUID만 넣어 주세요.");
                    }
                })
                .toList();
    }

    private <T> T checked(T input) {
        var errors = validator.validate(input);
        if (!errors.isEmpty())
            throw new IllegalArgumentException(errors.stream()
                    .map(error -> error.getPropertyPath() + ": " + error.getMessage())
                    .sorted()
                    .collect(java.util.stream.Collectors.joining(", ")));
        return input;
    }
}

package xyz.goraebap.workspace.document.application;

import org.springframework.beans.factory.annotation.Qualifier;
import xyz.goraebap.workspace.WorkspaceDatabaseConfig;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import xyz.goraebap.foundation.mcp.McpArguments;
import xyz.goraebap.foundation.mcp.McpTool;
import xyz.goraebap.foundation.mcp.McpToolProvider;
import xyz.goraebap.workspace.document.application.document.DocumentService;
import xyz.goraebap.workspace.document.application.library.LibraryService;
import xyz.goraebap.foundation.shared.error.BusinessException;
import xyz.goraebap.foundation.shared.error.DomainRuleViolation;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/** Preview and delete through the screen's service; each bulk item commits or rolls back independently. */
@Slf4j
@Component
@RequiredArgsConstructor
public class DocumentDeletionMcpTools implements McpToolProvider {
    private static final int MAX_TARGETS = 100;
    private static final String DESCRIPTION = "먼저 get_document_library 또는 get_document로 대상과 메타데이터 version을 읽으세요. "
            + "expectedVersion은 bodyVersion이 아닙니다. 기본 dry_run=true는 삭제하지 않고 권한·버전을 검사해 하위 페이지를 포함한 삭제 범위를 돌려줍니다. "
            + "사용자가 삭제를 요청한 범위를 확인한 뒤 dry_run=false를 명시하면 화면과 같은 소프트 삭제를 실행합니다. 하위 페이지도 함께 삭제됩니다. "
            + "만든 사람·관리 권한자·워크스페이스 관리자만 삭제할 수 있고, 하위 페이지의 쓰기·삭제 권한도 필요합니다. "
            + "삭제 후 조회·검색에서 제외되며 MCP 복원 도구는 없습니다. 이미 삭제한 문서를 다시 요청하면 찾을 수 없음입니다.";

    private final DocumentService documentService;
    private final LibraryService libraryService;
    @Qualifier(WorkspaceDatabaseConfig.TRANSACTION_MANAGER)
    private final PlatformTransactionManager transactionManager;

    @Override
    public List<McpTool> tools() {
        return List.of(
                McpTool.remove(
                        "delete_document",
                        "문서 삭제",
                        DESCRIPTION,
                        targetInput()
                                .string("project", "대상의 현재 프로젝트 키", true)
                                .bool("dry_run", "삭제하지 않고 범위만 확인 (기본 true). 실행은 false를 명시"),
                        (actor, arguments) -> {
                            String project = arguments.string("project");
                            var target = target(arguments);
                            libraryService.get(actor, project);
                            return deleteOne(
                                    actor,
                                    project,
                                    target,
                                    arguments.bool("dry_run").orElse(true));
                        }),
                McpTool.remove(
                        "delete_documents",
                        "여러 문서 삭제",
                        DESCRIPTION
                                + " 한 번에 1~100개를 입력 순서대로 처리하고 각 항목의 성공·실패와 오류 코드를 반환합니다. "
                                + "항목마다 독립 트랜잭션이므로 일부 실패해도 다른 항목의 성공은 유지됩니다. "
                                + "같은 ID의 중복이나 부모·자식을 함께 지정한 범위는 실행 전에 요청 전체를 거절합니다. 부모만 지정하세요. "
                                + "이미 성공한 항목을 재시도하지 말고 실패한 항목의 현재 상태를 다시 읽으세요.",
                        McpTool.input()
                                .string("project", "모든 대상이 속한 현재 프로젝트 키", true)
                                .objects(
                                        "documents",
                                        "삭제할 문서별 id·메타데이터 expectedVersion",
                                        targetInput(),
                                        1,
                                        MAX_TARGETS,
                                        true)
                                .bool("dry_run", "삭제하지 않고 항목별 범위만 확인 (기본 true). 실행은 false를 명시"),
                        this::deleteMany));
    }

    private static McpTool.Input targetInput() {
        return McpTool.input()
                .string("id", "문서 UUID", true)
                .integer("expectedVersion", "조회한 문서 메타데이터 version (bodyVersion 아님)", 0, Integer.MAX_VALUE, true);
    }

    private Object deleteMany(CurrentUser actor, McpArguments arguments) {
        String project = arguments.string("project");
        var inputs = arguments.objects("documents");
        if (inputs.isEmpty() || inputs.size() > MAX_TARGETS)
            throw new IllegalArgumentException("documents는 1~100개여야 합니다.");
        var targets = inputs.stream().map(DocumentDeletionMcpTools::target).toList();
        var selected = new HashSet<UUID>();
        for (var target : targets)
            if (!selected.add(target.id())) throw new IllegalArgumentException("같은 문서 ID를 중복 지정할 수 없습니다.");
        requireDisjoint(actor, project, selected);
        boolean dryRun = arguments.bool("dry_run").orElse(true);
        var results = new ArrayList<Map<String, Object>>();
        int succeeded = 0;
        for (var target : targets) {
            try {
                results.add(deleteOne(actor, project, target, dryRun));
                succeeded++;
            } catch (BusinessException failure) {
                results.add(failed(target, failure.errorCode().code(), failure.getMessage()));
            } catch (AccessDeniedException failure) {
                results.add(failed(target, "AUTH_FORBIDDEN", failure.getMessage()));
            } catch (DomainRuleViolation failure) {
                results.add(failed(target, "COMMON_INVALID_REQUEST", failure.getMessage()));
            } catch (RuntimeException failure) {
                log.error("MCP document deletion failed for {}", target.id(), failure);
                results.add(failed(target, "COMMON_INTERNAL_ERROR", "처리 중 오류가 발생했습니다. 현재 문서 상태를 다시 확인하세요."));
            }
        }
        return Map.of(
                "dryRun",
                dryRun,
                "requested",
                targets.size(),
                "succeeded",
                succeeded,
                "failed",
                targets.size() - succeeded,
                "results",
                results);
    }

    private Map<String, Object> deleteOne(CurrentUser actor, String project, Target target, boolean dryRun) {
        var transaction = new TransactionTemplate(transactionManager);
        transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        transaction.setReadOnly(dryRun);
        return transaction.execute(status -> {
            var document = documentService.get(actor, target.id()).document();
            if (document.projectKey() == null || !document.projectKey().equalsIgnoreCase(project.strip()))
                throw DocumentErrorCode.DOCUMENT_NOT_FOUND.raise();
            var scope = documentService.previewDelete(actor, target.id(), target.version());
            if (!dryRun) documentService.delete(actor, target.id(), target.version());
            return Map.of(
                    "id",
                    target.id(),
                    "status",
                    dryRun ? "preview" : "deleted",
                    "dryRun",
                    dryRun,
                    "affectedCount",
                    scope.size(),
                    "documents",
                    scope);
        });
    }

    /** Reject ambiguous cascades before the first deletion; the service still checks every descendant's rights. */
    private void requireDisjoint(CurrentUser actor, String project, Set<UUID> selected) {
        var parents = new HashMap<UUID, UUID>();
        libraryService.get(actor, project).pages().forEach(page -> parents.put(page.id(), page.parentId()));
        for (UUID id : selected) {
            var seen = new HashSet<UUID>();
            UUID parent = parents.get(id);
            while (parent != null && seen.add(parent)) {
                if (selected.contains(parent))
                    throw new IllegalArgumentException("부모와 하위 페이지를 함께 지정할 수 없습니다. 부모 문서만 지정하세요.");
                parent = parents.get(parent);
            }
        }
    }

    private static Target target(McpArguments arguments) {
        UUID id;
        try {
            id = UUID.fromString(arguments.string("id").strip().toLowerCase(Locale.ROOT));
        } catch (IllegalArgumentException invalid) {
            throw new IllegalArgumentException("id는 문서 UUID여야 합니다.");
        }
        long version = arguments.longInteger("expectedVersion");
        if (version < 0 || version > Integer.MAX_VALUE)
            throw new IllegalArgumentException("expectedVersion은 0 이상의 문서 version이어야 합니다.");
        return new Target(id, version);
    }

    private static Map<String, Object> failed(Target target, String code, String message) {
        return Map.of("id", target.id(), "status", "failed", "error", Map.of("code", code, "message", message));
    }

    private record Target(UUID id, long version) {}
}

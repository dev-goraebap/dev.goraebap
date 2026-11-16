package xyz.goraebap.workspace.document.application.system;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.workspace.document.SystemKind;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/**
 * 문서함's system folders (회의록, 주간보고): their rows at the top or in a project's folder, and one folder's documents
 * narrowed by project and facet. What each holds and who sees it are the modules' that make them.
 */
@RestController
@RequestMapping("/api/v1/workspace/document-box/systems")
@RequiredArgsConstructor
@Validated
public class SystemFolderController {
    private final SystemFolderService systemFolderService;

    /** The system folders at 문서함's top, or a project's (projectId: its 회의록). */
    @GetMapping
    public List<SystemViews.SystemFolder> folders(
            @AuthenticationPrincipal CurrentUser user, @RequestParam(required = false) UUID projectId) {
        return systemFolderService.folders(user, projectId);
    }

    /** One page of a system folder's documents, the latest changed first. */
    @GetMapping("/{kind}")
    public SystemViews.SystemSlice items(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable SystemKind kind,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID facet,
            @RequestParam(defaultValue = "0") @Min(0) int offset,
            @RequestParam(defaultValue = "30") @Min(1) @Max(100) int size) {
        return systemFolderService.items(user, kind, projectId, facet, offset, size);
    }
}

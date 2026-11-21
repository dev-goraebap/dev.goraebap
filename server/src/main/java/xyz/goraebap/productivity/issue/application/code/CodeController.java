package xyz.goraebap.productivity.issue.application.code;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * A project's repositories (프로젝트 설정 › 저장소 연동): its connections and the rules events move work items by, which
 * every member reads and Workspace administrators change, and a work item's links into them.
 */
@RestController
@RequestMapping("/api/v1/workspace/projects/{key}")
@RequiredArgsConstructor
public class CodeController {
    private final CodeService codeService;
    private final RepositoryConnections repositoryConnections;

    @GetMapping("/integrations")
    public List<CodeViews.Integration> integrations(
            @AuthenticationPrincipal CurrentUser user, @PathVariable String key) {
        return codeService.list(user, key);
    }

    /** Connects a repository; a token is checked with the host first (400 INTEGRATION_HOST_REFUSED with its reason). */
    @PostMapping("/integrations")
    public ResponseEntity<CodeViews.Integration> connect(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody CodeRequests.Connect request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(repositoryConnections.connect(user, key, request));
    }

    @PatchMapping("/integrations/{integrationId}")
    public CodeViews.Integration revise(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable UUID integrationId,
            @Valid @RequestBody CodeRequests.Revise request) {
        return repositoryConnections.revise(user, key, integrationId, request);
    }

    @DeleteMapping("/integrations/{integrationId}")
    public ResponseEntity<Void> disconnect(
            @AuthenticationPrincipal CurrentUser user, @PathVariable String key, @PathVariable UUID integrationId) {
        repositoryConnections.disconnect(user, key, integrationId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/integration-rules")
    public CodeViews.Rules rules(@AuthenticationPrincipal CurrentUser user, @PathVariable String key) {
        return codeService.rules(user, key);
    }

    @PutMapping("/integration-rules")
    public CodeViews.Rules setRules(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody CodeRequests.Rules request) {
        return repositoryConnections.setRules(user, key, request);
    }

    /** A work item's branches, pull or merge requests and commits, the latest moved last. */
    @GetMapping("/issues/{number}/code-links")
    public List<CodeViews.Link> links(
            @AuthenticationPrincipal CurrentUser user, @PathVariable String key, @PathVariable long number) {
        return codeService.links(user, key, number);
    }
}

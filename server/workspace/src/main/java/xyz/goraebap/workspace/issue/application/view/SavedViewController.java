package xyz.goraebap.workspace.issue.application.view;

import jakarta.validation.Valid;
import java.net.URI;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/**
 * The saved views over the issue lists: the area's at /issue-views, a project's under its key. A view itself is
 * addressed by its id wherever it belongs.
 */
@RestController
@RequestMapping("/api/v1/workspace")
@RequiredArgsConstructor
public class SavedViewController {
    private final SavedViewService savedViewService;

    /** The area's views (across every project) as the reader sees them, in the pills' order. */
    @GetMapping("/issue-views")
    public SavedViewViews.ViewList areaViews(@AuthenticationPrincipal CurrentUser user) {
        return savedViewService.list(user, null);
    }

    @PostMapping("/issue-views")
    public ResponseEntity<Void> createAreaView(
            @AuthenticationPrincipal CurrentUser user, @Valid @RequestBody SavedViewRequests.ViewInput request) {
        return created(savedViewService.create(user, null, request));
    }

    @PutMapping("/issue-views/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void orderAreaViews(
            @AuthenticationPrincipal CurrentUser user, @Valid @RequestBody SavedViewRequests.Order request) {
        savedViewService.order(user, null, request);
    }

    /** A project's views as the reader sees them, in the pills' order. */
    @GetMapping("/projects/{key}/issue-views")
    public SavedViewViews.ViewList projectViews(@AuthenticationPrincipal CurrentUser user, @PathVariable String key) {
        return savedViewService.list(user, key);
    }

    @PostMapping("/projects/{key}/issue-views")
    public ResponseEntity<Void> createProjectView(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody SavedViewRequests.ViewInput request) {
        return created(savedViewService.create(user, key, request));
    }

    @PutMapping("/projects/{key}/issue-views/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void orderProjectViews(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody SavedViewRequests.Order request) {
        savedViewService.order(user, key, request);
    }

    @PatchMapping("/issue-views/{viewId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID viewId,
            @Valid @RequestBody SavedViewRequests.EditView request) {
        savedViewService.edit(user, viewId, request);
    }

    @DeleteMapping("/issue-views/{viewId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal CurrentUser user, @PathVariable UUID viewId, @RequestParam long expectedVersion) {
        savedViewService.delete(user, viewId, expectedVersion);
    }

    private static ResponseEntity<Void> created(UUID id) {
        return ResponseEntity.created(URI.create("/api/v1/workspace/issue-views/" + id))
                .build();
    }
}

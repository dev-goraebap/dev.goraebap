package xyz.goraebap.cowork.module.workspace.issue.application.issue;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.cowork.shared.web.CurrentUser;

/**
 * A project's issues, addressed by the project's key (current or old) and the issue's number: every member reads them,
 * any member makes and changes them while the project is not archived.
 */
@RestController
@RequestMapping("/api/v1/workspace/projects/{key}/issues")
@RequiredArgsConstructor
public class IssueController {
    private final IssueService issueService;

    /** The project's issues matching the search, a slice at a time, by default in board order. */
    @GetMapping
    public IssueViews.IssueSlice list(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @ParameterObject @ModelAttribute IssueRequests.Listing listing) {
        return issueService.list(user, key, listing);
    }

    @PostMapping
    public ResponseEntity<Void> create(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody IssueRequests.CreateIssue request) {
        long number = issueService.create(user, key, request);
        return ResponseEntity.created(URI.create("/api/v1/workspace/projects/" + key + "/issues/" + number))
                .build();
    }

    @GetMapping("/groups")
    public java.util.List<IssueViews.IssueGroup> groups(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @ParameterObject @ModelAttribute IssueRequests.Listing listing,
            @org.springframework.web.bind.annotation.RequestParam IssueRequests.Grouping grouping) {
        return issueService.groups(user, key, listing, grouping);
    }

    @GetMapping("/{number}")
    public IssueViews.IssueView get(
            @AuthenticationPrincipal CurrentUser user, @PathVariable String key, @PathVariable long number) {
        return issueService.get(user, key, number);
    }

    @PatchMapping("/{number}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @Valid @RequestBody IssueRequests.EditIssue request) {
        issueService.edit(user, key, number, request);
    }

    /** Moves the issue on the board: into a column, right after another issue there or first. */
    @PostMapping("/{number}/move")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void move(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @Valid @RequestBody IssueRequests.Move request) {
        issueService.move(user, key, number, request);
    }

    @DeleteMapping("/{number}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @RequestParam long expectedVersion) {
        issueService.delete(user, key, number, expectedVersion);
    }

    /** The issue's comments and what happened to it, oldest first. */
    @GetMapping("/{number}/timeline")
    public List<IssueViews.TimelineEntry> timeline(
            @AuthenticationPrincipal CurrentUser user, @PathVariable String key, @PathVariable long number) {
        return issueService.timeline(user, key, number);
    }
}

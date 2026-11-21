package xyz.goraebap.productivity.issue.application.comment;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.shared.web.CurrentUser;

/** An issue's discussion; the comments are read with the issue's timeline. */
@RestController
@RequestMapping("/api/v1/workspace/projects/{key}/issues/{number}/comments")
@RequiredArgsConstructor
public class IssueCommentController {
    private final IssueCommentService issueCommentService;

    @PostMapping
    public ResponseEntity<Void> add(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @Valid @RequestBody IssueCommentRequests.CommentInput request) {
        UUID id = issueCommentService.add(user, key, number, request);
        return ResponseEntity.created(
                        URI.create("/api/v1/workspace/projects/" + key + "/issues/" + number + "/comments/" + id))
                .build();
    }

    @PatchMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @PathVariable UUID commentId,
            @Valid @RequestBody IssueCommentRequests.CommentInput request) {
        issueCommentService.edit(user, key, number, commentId, request);
    }

    /** Resolves the thread a comment starts, or opens it again. */
    @PutMapping("/{commentId}/resolution")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resolve(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @PathVariable UUID commentId,
            @Valid @RequestBody IssueCommentRequests.Resolution request) {
        issueCommentService.resolve(user, key, number, commentId, request);
    }

    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @PathVariable UUID commentId) {
        issueCommentService.delete(user, key, number, commentId);
    }
}

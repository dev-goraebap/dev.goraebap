package xyz.goraebap.productivity.issue.application.body;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.productivity.richbody.RichBodyFacade;
import xyz.goraebap.productivity.richbody.RichBodyPatch;
import xyz.goraebap.productivity.richbody.RichBodyState;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * An issue's body, its versions and comment threads, and the files it shows. Saving, commenting and restoring answer
 * the body as kept (an exception to the empty answer of a change): the editor goes on over the version it gives.
 */
@RestController
@RequestMapping("/api/v1/workspace/projects/{key}/issues/{number}")
@RequiredArgsConstructor
public class IssueBodyController {
    private final IssueBodyService issueBodyService;

    @GetMapping("/body/editing")
    public List<RichBodyFacade.Editor> editors(
            @AuthenticationPrincipal CurrentUser user, @PathVariable String key, @PathVariable long number) {
        return issueBodyService.editors(user, key, number);
    }

    @PutMapping("/body/editing/{lease}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void editing(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @PathVariable UUID lease) {
        issueBodyService.editing(user, key, number, lease);
    }

    @DeleteMapping("/body/editing/{lease}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void stopEditing(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @PathVariable UUID lease) {
        issueBodyService.stopEditing(user, key, number, lease);
    }

    @GetMapping("/body")
    public RichBodyState body(
            @AuthenticationPrincipal CurrentUser user, @PathVariable String key, @PathVariable long number) {
        return issueBodyService.read(user, key, number);
    }

    /** One kept version with its body (the body's version list leaves the bodies out). */
    @GetMapping("/body/versions/{versionId}")
    public RichBodyState.BodyVersion version(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @PathVariable UUID versionId) {
        return issueBodyService.version(user, key, number, versionId);
    }

    /** Saves the body over the version read; 409 RICH_BODY_VERSION_CONFLICT when it changed since. */
    @PutMapping("/body")
    public RichBodyState save(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @Valid @RequestBody IssueBodyRequests.Save request) {
        return issueBodyService.save(user, key, number, request);
    }

    /** Saves the body's changed blocks over the block versions read; 409 RICH_BODY_BLOCK_CONFLICT when one changed since. */
    @PatchMapping("/body")
    public RichBodyState patch(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @RequestBody RichBodyPatch request) {
        return issueBodyService.patch(user, key, number, request);
    }

    @PostMapping("/body/revisions/{revisionId}/restore")
    public RichBodyState restore(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @PathVariable UUID revisionId,
            @Valid @RequestBody IssueBodyRequests.Restore request) {
        return issueBodyService.restore(user, key, number, revisionId, request);
    }

    /** Opens one of the body's files: a redirect to a short-lived address, the issue's readers only. */
    @GetMapping("/files/{fileId}")
    public ResponseEntity<Void> file(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @PathVariable UUID fileId,
            @RequestParam(defaultValue = "false") boolean download) {
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(issueBodyService.fileUrl(user, key, number, fileId, download))
                .build();
    }
}

package xyz.goraebap.cowork.module.workspace.document.application.chapter;

import jakarta.validation.Valid;
import java.net.URI;
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
import xyz.goraebap.cowork.module.workspace.document.application.activity.BodyActivityRequests;
import xyz.goraebap.cowork.module.workspace.document.application.activity.BodyActivityViews;
import xyz.goraebap.cowork.module.workspace.document.application.body.DocumentBodyRequests;
import xyz.goraebap.cowork.module.workspace.richbody.RichBodyFacade;
import xyz.goraebap.cowork.module.workspace.richbody.RichBodyPatch;
import xyz.goraebap.cowork.module.workspace.richbody.RichBodyState;
import xyz.goraebap.cowork.shared.web.CurrentUser;

/**
 * A 매뉴얼 chapter's body, its versions and activity, and the files it shows, as a document's; the requests are a
 * document body's own.
 */
@RestController
@RequestMapping("/api/v1/workspace/manual-chapters/{id}")
@RequiredArgsConstructor
public class ChapterBodyController {
    private final ChapterBodyService chapterBodyService;

    @GetMapping("/body/editing")
    public List<RichBodyFacade.Editor> editors(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id) {
        return chapterBodyService.editors(user, id);
    }

    @PutMapping("/body/editing/{lease}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void editing(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id, @PathVariable UUID lease) {
        chapterBodyService.editing(user, id, lease);
    }

    @DeleteMapping("/body/editing/{lease}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void stopEditing(
            @AuthenticationPrincipal CurrentUser user, @PathVariable UUID id, @PathVariable UUID lease) {
        chapterBodyService.stopEditing(user, id, lease);
    }

    @GetMapping("/body")
    public RichBodyState body(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id) {
        return chapterBodyService.read(user, id);
    }

    /** One kept version with its body (the body's version list leaves the bodies out). */
    @GetMapping("/body/versions/{versionId}")
    public RichBodyState.BodyVersion version(
            @AuthenticationPrincipal CurrentUser user, @PathVariable UUID id, @PathVariable UUID versionId) {
        return chapterBodyService.version(user, id, versionId);
    }

    /** Saves the body over the version read; 409 RICH_BODY_VERSION_CONFLICT when it changed since. */
    @PutMapping("/body")
    public RichBodyState save(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @Valid @RequestBody DocumentBodyRequests.Save request) {
        return chapterBodyService.save(user, id, request);
    }

    /** Saves the body's changed blocks over the block versions read; 409 RICH_BODY_BLOCK_CONFLICT when one changed since. */
    @PatchMapping("/body")
    public RichBodyState patch(
            @AuthenticationPrincipal CurrentUser user, @PathVariable UUID id, @RequestBody RichBodyPatch request) {
        return chapterBodyService.patch(user, id, request);
    }

    /** The chapter's comments and what happened to it, oldest first. */
    @GetMapping("/timeline")
    public List<BodyActivityViews.Entry> timeline(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id) {
        return chapterBodyService.timeline(user, id);
    }

    @PostMapping("/comments")
    public ResponseEntity<Void> addComment(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @Valid @RequestBody BodyActivityRequests.CommentInput request) {
        UUID commentId = chapterBodyService.addComment(user, id, request);
        return ResponseEntity.created(URI.create("/api/v1/workspace/manual-chapters/" + id + "/comments/" + commentId))
                .build();
    }

    @PatchMapping("/comments/{commentId}")
    public ResponseEntity<Void> editComment(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @PathVariable UUID commentId,
            @Valid @RequestBody BodyActivityRequests.CommentEdit request) {
        chapterBodyService.editComment(user, id, commentId, request);
        return ResponseEntity.noContent().build();
    }

    /** Resolves the thread a comment starts, or opens it again (a comment on a block shows there until resolved). */
    @PutMapping("/comments/{commentId}/resolution")
    public ResponseEntity<Void> resolveComment(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @PathVariable UUID commentId,
            @Valid @RequestBody BodyActivityRequests.Resolution request) {
        chapterBodyService.resolveComment(user, id, commentId, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @AuthenticationPrincipal CurrentUser user, @PathVariable UUID id, @PathVariable UUID commentId) {
        chapterBodyService.deleteComment(user, id, commentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/body/revisions/{revisionId}/restore")
    public RichBodyState restore(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @PathVariable UUID revisionId,
            @Valid @RequestBody DocumentBodyRequests.Restore request) {
        return chapterBodyService.restore(user, id, revisionId, request);
    }

    /** Opens one of the body's files: a redirect to a short-lived address, the manual's readers only. */
    @GetMapping("/files/{fileId}")
    public ResponseEntity<Void> file(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @PathVariable UUID fileId,
            @RequestParam(defaultValue = "false") boolean download) {
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(chapterBodyService.fileUrl(user, id, fileId, download))
                .build();
    }
}

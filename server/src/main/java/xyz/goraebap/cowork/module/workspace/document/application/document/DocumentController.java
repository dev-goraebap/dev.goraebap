package xyz.goraebap.cowork.module.workspace.document.application.document;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.cowork.shared.web.CurrentUser;

/**
 * Documents of the projects area (문서), in the shared space or a project's, addressed by id: every member reads them,
 * any member makes and changes them where they may write. One list serves the area's menu (every space), a space, a
 * folder and the search.
 */
@RestController
@RequestMapping("/api/v1/workspace/documents")
@RequiredArgsConstructor
public class DocumentController {
    private final DocumentService documentService;

    /** Documents matching the search, a slice at a time, by default the latest written first. */
    @GetMapping
    public DocumentViews.DocumentSlice list(
            @AuthenticationPrincipal CurrentUser user,
            @Valid @ParameterObject @ModelAttribute DocumentRequests.Listing listing) {
        return documentService.list(user, listing);
    }

    /** A new document, empty or with its first body (the editor's JSON or Markdown). */
    @PostMapping
    public ResponseEntity<Void> create(
            @AuthenticationPrincipal CurrentUser user, @Valid @RequestBody DocumentRequests.CreateDocument request) {
        UUID id = documentService.create(user, request);
        return ResponseEntity.created(URI.create("/api/v1/workspace/documents/" + id))
                .build();
    }

    @GetMapping("/{id}")
    public DocumentViews.DocumentView get(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id) {
        return documentService.get(user, id);
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rename(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @Valid @RequestBody DocumentRequests.RenameDocument request) {
        documentService.rename(user, id, request);
    }

    /** Gives the document another mark (icon and colour), or none. */
    @PutMapping("/{id}/mark")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void mark(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @Valid @RequestBody DocumentRequests.MarkDocument request) {
        documentService.mark(user, id, request);
    }

    /** Puts the document in another folder of its space, or at its top. */
    @PostMapping("/{id}/move")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void move(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @Valid @RequestBody DocumentRequests.MoveDocument request) {
        documentService.move(user, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal CurrentUser user, @PathVariable UUID id, @RequestParam long expectedVersion) {
        documentService.delete(user, id, expectedVersion);
    }
}

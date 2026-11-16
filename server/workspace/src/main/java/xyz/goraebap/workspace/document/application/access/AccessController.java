package xyz.goraebap.workspace.document.application.access;

import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/** The permissions of a document and of a folder: read by whoever sees the item, put in place by whoever manages it. */
@RestController
@RequestMapping("/api/v1/workspace")
@RequiredArgsConstructor
public class AccessController {
    private final AccessService accessService;

    @GetMapping("/documents/{id}/access")
    public AccessViews.AccessView document(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id) {
        return accessService.document(user, id);
    }

    /** The document's grants in place of what it had; none opens it. */
    @PutMapping("/documents/{id}/access")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void replaceDocument(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @Valid @RequestBody AccessViews.ReplaceGrants request) {
        accessService.replaceDocument(user, id, request);
    }

    @GetMapping("/document-folders/{id}/access")
    public AccessViews.AccessView folder(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id) {
        return accessService.folder(user, id);
    }

    /** The folder's grants in place of what it had; none opens it. */
    @PutMapping("/document-folders/{id}/access")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void replaceFolder(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @Valid @RequestBody AccessViews.ReplaceGrants request) {
        accessService.replaceFolder(user, id, request);
    }
}

package xyz.goraebap.workspace.document.application.library;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.workspace.document.application.library.LibraryModels.Labels;
import xyz.goraebap.workspace.document.application.library.LibraryModels.Library;
import xyz.goraebap.workspace.document.application.library.LibraryModels.MovePage;
import xyz.goraebap.workspace.document.application.library.LibraryModels.SaveOrder;
import xyz.goraebap.workspace.document.application.library.LibraryModels.SaveView;
import xyz.goraebap.foundation.shared.web.CurrentUser;

@RestController
@RequestMapping("/api/v1/workspace/projects/{key}/document-library")
@RequiredArgsConstructor
public class LibraryController {
    private final LibraryService service;

    @GetMapping
    public Library get(@AuthenticationPrincipal CurrentUser user, @PathVariable String key) {
        return service.get(user, key);
    }

    @PutMapping("/documents/{id}/labels")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void labels(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable UUID id,
            @Valid @RequestBody Labels value) {
        service.assign(user, key, id, value);
    }

    @PostMapping("/views")
    public ResponseEntity<Void> view(
            @AuthenticationPrincipal CurrentUser user, @PathVariable String key, @Valid @RequestBody SaveView value) {
        return created(key, "views", service.view(user, key, null, value));
    }

    @PutMapping("/views/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void orderViews(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody LibraryModels.ViewOrder value) {
        service.orderViews(user, key, value);
    }

    @PutMapping("/views/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void view(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable UUID id,
            @Valid @RequestBody SaveView value) {
        service.view(user, key, id, value);
    }

    @DeleteMapping("/views/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeView(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable UUID id,
            @RequestParam long expectedVersion) {
        service.deleteView(user, key, id, expectedVersion);
    }

    @PutMapping("/documents/{id}/parent")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void parent(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable UUID id,
            @Valid @RequestBody MovePage value) {
        service.parent(user, key, id, value);
    }

    @PutMapping("/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void order(
            @AuthenticationPrincipal CurrentUser user, @PathVariable String key, @Valid @RequestBody SaveOrder value) {
        service.order(user, key, value);
    }

    private static ResponseEntity<Void> created(String key, String kind, UUID id) {
        return ResponseEntity.created(
                        URI.create("/api/v1/workspace/projects/" + key + "/document-library/" + kind + "/" + id))
                .build();
    }
}

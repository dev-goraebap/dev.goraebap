package xyz.goraebap.productivity.document.application.library;

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
import xyz.goraebap.shared.web.CurrentUser;

@RestController
@RequestMapping("/api/v1/workspace/document-labels")
@RequiredArgsConstructor
public class DocumentLabelController {
    private final DocumentLabelService service;

    @GetMapping
    public List<DocumentLabelModels.LabelView> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Void> create(
            @AuthenticationPrincipal CurrentUser user, @Valid @RequestBody DocumentLabelModels.Input input) {
        return ResponseEntity.created(URI.create("/api/v1/workspace/document-labels/" + service.create(user, input)))
                .build();
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @Valid @RequestBody DocumentLabelModels.Edit input) {
        service.edit(user, id, input);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal CurrentUser user, @PathVariable UUID id, @RequestParam long expectedVersion) {
        service.delete(user, id, expectedVersion);
    }

    @PutMapping("/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void order(@AuthenticationPrincipal CurrentUser user, @Valid @RequestBody DocumentLabelModels.Order input) {
        service.order(user, input);
    }
}

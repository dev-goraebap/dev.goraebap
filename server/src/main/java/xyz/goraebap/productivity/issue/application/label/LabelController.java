package xyz.goraebap.productivity.issue.application.label;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.shared.web.CurrentUser;

/** The workspace's labels (BIT D-009): every member reads them; Workspace administrators change them. */
@RestController
@RequestMapping("/api/v1/workspace/work-item-labels")
@RequiredArgsConstructor
public class LabelController {
    private final LabelService labelService;

    @GetMapping
    public List<LabelViews.LabelView> labels() {
        return labelService.labels();
    }

    @PostMapping
    public ResponseEntity<Void> create(
            @AuthenticationPrincipal CurrentUser user, @Valid @RequestBody LabelRequests.LabelInput request) {
        UUID id = labelService.create(user, request);
        return ResponseEntity.created(URI.create("/api/v1/workspace/work-item-labels/" + id))
                .build();
    }

    @PatchMapping("/{labelId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID labelId,
            @Valid @RequestBody LabelRequests.LabelInput request) {
        labelService.edit(user, labelId, request);
    }

    @PutMapping("/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(@AuthenticationPrincipal CurrentUser user, @Valid @RequestBody LabelRequests.Order request) {
        labelService.reorder(user, request);
    }

    @DeleteMapping("/{labelId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID labelId) {
        labelService.delete(user, labelId);
    }
}

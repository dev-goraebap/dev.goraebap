package xyz.goraebap.workspace.issue.application.type;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
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
import xyz.goraebap.foundation.shared.web.CurrentUser;

/** The workspace's work item types (BIT D-104): every member reads them; Workspace administrators change them. */
@RestController
@RequestMapping("/api/v1/workspace/work-item-types")
@RequiredArgsConstructor
public class TypeController {
    private final TypeService typeService;

    @GetMapping
    public List<TypeViews.TypeView> types() {
        return typeService.types();
    }

    @PostMapping
    public ResponseEntity<Void> create(
            @AuthenticationPrincipal CurrentUser user, @Valid @RequestBody TypeRequests.TypeInput request) {
        String code = typeService.create(user, request);
        return ResponseEntity.created(URI.create("/api/v1/workspace/work-item-types/" + code))
                .build();
    }

    @PatchMapping("/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String code,
            @Valid @RequestBody TypeRequests.TypeInput request) {
        typeService.edit(user, code, request);
    }

    @PutMapping("/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(@AuthenticationPrincipal CurrentUser user, @Valid @RequestBody TypeRequests.Order request) {
        typeService.reorder(user, request);
    }

    @DeleteMapping("/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal CurrentUser user, @PathVariable String code) {
        typeService.delete(user, code);
    }
}

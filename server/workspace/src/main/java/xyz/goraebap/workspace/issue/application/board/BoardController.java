package xyz.goraebap.workspace.issue.application.board;

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
import xyz.goraebap.foundation.shared.web.CurrentUser;

/** A project's board columns, the statuses its issues move through: every member reads them, administrators keep them. */
@RestController
@RequestMapping("/api/v1/workspace/projects/{key}/columns")
@RequiredArgsConstructor
public class BoardController {
    private final BoardService boardService;

    @GetMapping
    public List<BoardViews.ColumnView> columns(@AuthenticationPrincipal CurrentUser user, @PathVariable String key) {
        return boardService.columns(user, key);
    }

    @PostMapping
    public ResponseEntity<Void> create(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody BoardRequests.ColumnInput request) {
        UUID id = boardService.create(user, key, request);
        return ResponseEntity.created(URI.create("/api/v1/workspace/projects/" + key + "/columns/" + id))
                .build();
    }

    @PutMapping("/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody BoardRequests.ColumnOrder request) {
        boardService.reorder(user, key, request);
    }

    @PatchMapping("/{columnId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable UUID columnId,
            @Valid @RequestBody BoardRequests.ColumnInput request) {
        boardService.edit(user, key, columnId, request);
    }

    @DeleteMapping("/{columnId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal CurrentUser user, @PathVariable String key, @PathVariable UUID columnId) {
        boardService.delete(user, key, columnId);
    }
}

package xyz.goraebap.productivity.document.application.chapter;

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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * The chapters of a 매뉴얼: listed and made under the manual (/documents/{id}/chapters), changed by their own id
 * (/manual-chapters/{id}).
 */
@RestController
@RequestMapping("/api/v1/workspace")
@RequiredArgsConstructor
public class ChapterController {
    private final ChapterService chapterService;

    /** Every chapter of the manual by place; the client builds the tree from each chapter's parent. */
    @GetMapping("/documents/{id}/chapters")
    public List<ChapterViews.ChapterRow> list(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id) {
        return chapterService.list(user, id);
    }

    @PostMapping("/documents/{id}/chapters")
    public ResponseEntity<Void> create(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @Valid @RequestBody ChapterRequests.CreateChapter request) {
        UUID chapterId = chapterService.create(user, id, request);
        return ResponseEntity.created(URI.create("/api/v1/workspace/manual-chapters/" + chapterId))
                .build();
    }

    @PatchMapping("/manual-chapters/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rename(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @Valid @RequestBody ChapterRequests.RenameChapter request) {
        chapterService.rename(user, id, request);
    }

    /** Puts the chapter under another of its manual, at a place among its new siblings. */
    @PostMapping("/manual-chapters/{id}/move")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void move(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @Valid @RequestBody ChapterRequests.MoveChapter request) {
        chapterService.move(user, id, request);
    }

    /** Deletes the chapter and the chapters under it. */
    @DeleteMapping("/manual-chapters/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal CurrentUser user, @PathVariable UUID id, @RequestParam long expectedVersion) {
        chapterService.delete(user, id, expectedVersion);
    }
}

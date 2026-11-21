package xyz.goraebap.cowork.module.workspace.issue.application.time;

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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.cowork.shared.web.CurrentUser;

/** Time spent on a work item (소요시간). */
@RestController
@RequestMapping("/api/v1/workspace/projects/{key}/issues/{number}/time-entries")
@RequiredArgsConstructor
public class TimeEntryController {
    private final TimeEntryService timeEntryService;

    @GetMapping
    public TimeEntryModels.Entries list(
            @AuthenticationPrincipal CurrentUser user, @PathVariable String key, @PathVariable long number) {
        return timeEntryService.list(user, key, number);
    }

    @PostMapping
    public ResponseEntity<Void> log(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @Valid @RequestBody TimeEntryModels.Log request) {
        UUID id = timeEntryService.log(user, key, number, request);
        return ResponseEntity.created(
                        URI.create("/api/v1/workspace/projects/" + key + "/issues/" + number + "/time-entries/" + id))
                .build();
    }

    @DeleteMapping("/{entryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable long number,
            @PathVariable UUID entryId) {
        timeEntryService.delete(user, key, number, entryId);
    }
}

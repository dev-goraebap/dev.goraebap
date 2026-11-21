package xyz.goraebap.cowork.module.workspace.issue.application.cycle;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.Map;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.cowork.shared.web.CurrentUser;

/** A project's cycles (스프린트). */
@RestController
@RequestMapping("/api/v1/workspace/projects/{key}/cycles")
@RequiredArgsConstructor
public class CycleController {
    private final CycleService cycleService;

    @GetMapping
    public CycleModels.Cycles list(@AuthenticationPrincipal CurrentUser user, @PathVariable String key) {
        return cycleService.list(user, key);
    }

    @org.springframework.web.bind.annotation.PutMapping("/settings")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void saveSettings(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody CycleModels.Settings settings) {
        cycleService.saveSettings(user, key, settings);
    }

    @PostMapping
    public ResponseEntity<Void> create(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody CycleModels.Input input) {
        UUID id = cycleService.create(user, key, input);
        return ResponseEntity.created(URI.create("/api/v1/workspace/projects/" + key + "/cycles/" + id))
                .build();
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable UUID id,
            @Valid @RequestBody CycleModels.Input input) {
        cycleService.edit(user, key, id, input);
    }

    /** Finishes the cycle; how many unfinished work items were passed on comes back. */
    @PostMapping("/{id}/complete")
    public Map<String, Integer> complete(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable UUID id,
            @Valid @RequestBody CycleModels.Completion completion) {
        return Map.of("moved", cycleService.complete(user, key, id, completion));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal CurrentUser user, @PathVariable String key, @PathVariable UUID id) {
        cycleService.delete(user, key, id);
    }
}

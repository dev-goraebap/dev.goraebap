package xyz.goraebap.module.workspace.project.application;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
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
import xyz.goraebap.shared.web.CurrentUser;

/** Projects every member reads, and what Workspace administrators change. A project's address is its key, current or old. */
@RestController
@RequestMapping("/api/v1/workspace/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;

    /** Active projects in their order, or archived or (for administrators) deleted ones by name. */
    @GetMapping
    public List<ProjectViews.ProjectView> list(
            @AuthenticationPrincipal CurrentUser user,
            @ParameterObject @ModelAttribute ProjectRequests.Listing listing) {
        return projectService.list(user, listing);
    }

    @PostMapping
    public ResponseEntity<Void> create(
            @AuthenticationPrincipal CurrentUser user, @Valid @RequestBody ProjectRequests.CreateProject request) {
        String key = projectService.create(user, request);
        return ResponseEntity.created(URI.create("/api/v1/workspace/projects/" + key))
                .build();
    }

    /** Puts the active projects in a new order. */
    @PutMapping("/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(@AuthenticationPrincipal CurrentUser user, @Valid @RequestBody ProjectRequests.Order request) {
        projectService.reorder(user, request);
    }

    /** Who belongs to which live project with which role, for the area's members page: the projects the reader sees. */
    @GetMapping("/members")
    public List<ProjectViews.Membership> memberships(@AuthenticationPrincipal CurrentUser user) {
        return projectService.memberships(user);
    }

    /** The reader's favourite projects. */
    @GetMapping("/favorites")
    public List<UUID> favorites(@AuthenticationPrincipal CurrentUser user) {
        return projectService.favorites(user);
    }

    @GetMapping("/{key}")
    public ProjectViews.ProjectView get(@AuthenticationPrincipal CurrentUser user, @PathVariable String key) {
        return projectService.get(user, key);
    }

    @PatchMapping("/{key}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody ProjectRequests.EditProject request) {
        projectService.edit(user, key, request);
    }

    @DeleteMapping("/{key}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal CurrentUser user, @PathVariable String key, @RequestParam long expectedVersion) {
        projectService.delete(user, key, expectedVersion);
    }

    @PostMapping("/{key}/archive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody ProjectRequests.Versioned request) {
        projectService.archive(user, key, request);
    }

    @PostMapping("/{key}/unarchive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unarchive(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody ProjectRequests.Versioned request) {
        projectService.unarchive(user, key, request);
    }

    @PostMapping("/{key}/restore")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void restore(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody ProjectRequests.Versioned request) {
        projectService.restore(user, key, request);
    }

    @GetMapping("/{key}/members")
    public List<ProjectViews.MemberView> members(@AuthenticationPrincipal CurrentUser user, @PathVariable String key) {
        return projectService.members(user, key);
    }

    @PostMapping("/{key}/members")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addMember(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody ProjectRequests.AddMember request) {
        projectService.addMember(user, key, request);
    }

    @PatchMapping("/{key}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeMember(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @PathVariable UUID userId,
            @Valid @RequestBody ProjectRequests.ChangeMember request) {
        projectService.changeMember(user, key, userId, request);
    }

    @DeleteMapping("/{key}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(
            @AuthenticationPrincipal CurrentUser user, @PathVariable String key, @PathVariable UUID userId) {
        projectService.removeMember(user, key, userId);
    }

    @PutMapping("/{key}/favorite")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void favorite(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String key,
            @Valid @RequestBody ProjectRequests.Favorite request) {
        projectService.favorite(user, key, request);
    }
}

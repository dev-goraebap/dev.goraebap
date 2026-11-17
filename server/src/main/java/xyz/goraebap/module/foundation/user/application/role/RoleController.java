package xyz.goraebap.module.foundation.user.application.role;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.shared.web.CurrentUser;

/** The roles members hold, which instance administrators give out. */
@RestController
@RequestMapping("/api/v1/admin/roles")
@PreAuthorize("hasAuthority('INSTANCE_ADMIN')")
@RequiredArgsConstructor
public class RoleController {
    private final RoleService roleService;

    @GetMapping
    public List<RoleViews.RoleMember> members() {
        return roleService.members();
    }

    @PutMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void change(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID userId,
            @Valid @RequestBody RoleRequests.RoleChange request) {
        roleService.change(user.id(), userId, request);
    }
}

package xyz.goraebap.foundation.user.application.role;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.foundation.user.NewUser;
import xyz.goraebap.foundation.user.UserFacade;
import xyz.goraebap.foundation.user.UserStatus;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * Members an instance administrator adds by e-mail. One added may sign in at once (a code to that e-mail) and finishes
 * the first-login onboarding there; the roles are given out apart (RoleController).
 */
@RestController
@RequestMapping("/api/v1/admin/members")
@PreAuthorize("hasAuthority('INSTANCE_ADMIN')")
@RequiredArgsConstructor
public class MemberController {
    private final UserFacade userFacade;

    public record Invite(
            @NotBlank @Size(max = 64) String name,
            @NotBlank @Email @Size(max = 254) String email) {}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoleViews.RoleMember invite(@AuthenticationPrincipal CurrentUser user, @Valid @RequestBody Invite request) {
        var member = userFacade.checked(
                new NewUser(UUID.randomUUID(), request.name(), request.email(), null, UserStatus.ACTIVE));
        userFacade.registerAll(user.id(), java.util.List.of(member));
        return new RoleViews.RoleMember(member.id(), member.name(), member.email(), Set.of());
    }
}

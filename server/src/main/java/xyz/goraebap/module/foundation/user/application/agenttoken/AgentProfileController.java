package xyz.goraebap.module.foundation.user.application.agenttoken;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.shared.web.CurrentUser;

@RestController
@RequestMapping("/api/v1/me/agents")
@RequiredArgsConstructor
public class AgentProfileController {
    private final AgentTokenService agentTokenService;

    @GetMapping
    public List<AgentTokenViews.ProfileView> list(@AuthenticationPrincipal CurrentUser user) {
        return agentTokenService.profiles(user);
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable UUID id,
            @Valid @RequestBody AgentTokenRequests.EditProfile request) {
        agentTokenService.editProfile(user, id, request);
    }
}

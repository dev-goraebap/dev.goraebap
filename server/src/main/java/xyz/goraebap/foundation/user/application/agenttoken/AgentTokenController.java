package xyz.goraebap.foundation.user.application.agenttoken;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.foundation.user.application.AuthCookies;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * The signed-in member's agent tokens (내 계정 › 에이전트 토큰). Making one answers 201 with the token in the body, the one
 * time it is shown (the shared API contract's exception for what the screen must use at once); there is no address to
 * read it again.
 */
@RestController
@RequestMapping("/api/v1/me/agent-tokens")
@RequiredArgsConstructor
public class AgentTokenController {
    private final AgentTokenService agentTokenService;
    private final AuthCookies authCookies;

    @GetMapping
    public List<AgentTokenViews.TokenView> list(@AuthenticationPrincipal CurrentUser user) {
        return agentTokenService.list(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AgentTokenViews.Created create(
            @AuthenticationPrincipal CurrentUser user,
            @Valid @RequestBody AgentTokenRequests.Create request,
            HttpServletRequest httpRequest) {
        return agentTokenService.create(user, authCookies.read(httpRequest), request);
    }

    @DeleteMapping("/{tokenId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID tokenId) {
        agentTokenService.revoke(user, tokenId);
    }
}

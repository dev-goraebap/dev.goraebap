package xyz.goraebap.foundation.notification.application;

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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.shared.web.CurrentUser;

/** The member's own browser push: the server's key, their devices, which notices they take, and a test push. */
@RestController
@RequestMapping("/api/v1/push")
@RequiredArgsConstructor
public class PushController {
    private final PushService pushService;

    @GetMapping("/config")
    public PushViews.PushConfig config() {
        return pushService.config();
    }

    @GetMapping("/devices")
    public List<PushViews.PushDevice> devices(@AuthenticationPrincipal CurrentUser user) {
        return pushService.devices(user);
    }

    /** Adds this browser, or renews it when it was seen before; the page calls it on every visit with push on. */
    @PutMapping("/devices")
    public PushViews.PushDevice subscribe(
            @AuthenticationPrincipal CurrentUser user, @Valid @RequestBody PushRequests.PushSubscribe request) {
        return pushService.subscribe(user, request);
    }

    @DeleteMapping("/devices/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id) {
        pushService.remove(user, id);
    }

    @GetMapping("/preferences")
    public PushViews.PushPreferences preferences(@AuthenticationPrincipal CurrentUser user) {
        return pushService.preferences(user);
    }

    @PutMapping("/preferences")
    public PushViews.PushPreferences updatePreferences(
            @AuthenticationPrincipal CurrentUser user, @Valid @RequestBody PushRequests.PushPreferencesChange request) {
        return pushService.updatePreferences(user, request);
    }

    @PostMapping("/tests")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public PushViews.PushTestQueued test(
            @AuthenticationPrincipal CurrentUser user, @Valid @RequestBody PushRequests.PushTestRequest request) {
        return pushService.test(user, request);
    }
}

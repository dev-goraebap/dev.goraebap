package xyz.goraebap.foundation.notification.application;

import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.shared.web.CurrentUser;

/** The member's own notices. */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public NotificationViews.NotificationSlice mine(
            @AuthenticationPrincipal CurrentUser user,
            @ParameterObject @Valid @ModelAttribute NotificationRequests.NotificationListing listing) {
        return notificationService.mine(user, listing);
    }

    @GetMapping("/unread-count")
    public NotificationViews.UnreadNotifications unread(@AuthenticationPrincipal CurrentUser user) {
        return notificationService.unread(user);
    }

    /** Marks one notice read; reading again changes nothing. */
    @PostMapping("/{id}/reads")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void read(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id) {
        notificationService.read(user, id);
    }

    /**
     * Marks the member's notices about a subject read after they open it.
     */
    @PostMapping("/seen")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void seen(@AuthenticationPrincipal CurrentUser user, @Valid @RequestBody NotificationRequests.Seen seen) {
        notificationService.seen(user, seen);
    }

    /** Marks every unread notice read. */
    @PostMapping("/reads")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void readAll(@AuthenticationPrincipal CurrentUser user) {
        notificationService.readAll(user);
    }
}

package xyz.goraebap.foundation.notification.application;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import xyz.goraebap.foundation.shared.web.RecordedRead;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** How browser push goes across the company, for administrators. */
@RestController
@RequestMapping("/api/v1/push-deliveries")
@PreAuthorize("hasAuthority('INSTANCE_ADMIN')")
@RequiredArgsConstructor
public class PushAdminController {
    private final PushAdminService pushAdminService;

    @GetMapping("/summary")
    public PushViews.PushSummary summary() {
        return pushAdminService.summary();
    }

    @GetMapping("/kinds")
    public List<PushViews.NoticeKindRow> kinds() {
        return pushAdminService.kinds();
    }

    @GetMapping("/members")
    public List<PushViews.PushMemberRow> members(
            @ParameterObject @Valid @ModelAttribute PushRequests.PushMemberListing listing) {
        return pushAdminService.members(listing);
    }

    @RecordedRead
    @GetMapping("/members/{userId}")
    public PushViews.PushMemberDetail member(@PathVariable UUID userId) {
        return pushAdminService.member(userId);
    }

    @PostMapping("/members/{userId}/tests")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public PushViews.PushTestQueued test(@PathVariable UUID userId) {
        return pushAdminService.test(userId);
    }
}

package xyz.goraebap.foundation.system.application;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The server's state, traffic, activity record and errors, for administrators. */
@RestController
@RequestMapping("/api/v1/system")
@PreAuthorize("hasAuthority('INSTANCE_ADMIN')")
@RequiredArgsConstructor
public class SystemStatusController {
    private final SystemStatusService systemStatusService;

    @GetMapping("/status")
    public SystemViews.Status status() {
        return systemStatusService.status();
    }

    @GetMapping("/traffic")
    public SystemViews.Traffic traffic(@ParameterObject @ModelAttribute SystemRequests.TrafficSpan span) {
        return systemStatusService.traffic(span);
    }

    @GetMapping("/activities")
    public SystemViews.ActivitySlice activities(
            @ParameterObject @Valid @ModelAttribute SystemRequests.ActivityListing listing) {
        return systemStatusService.activities(listing);
    }

    @GetMapping("/errors")
    public SystemViews.ErrorSlice errors(@ParameterObject @Valid @ModelAttribute SystemRequests.ErrorListing listing) {
        return systemStatusService.errors(listing);
    }

    @GetMapping("/errors/{id}")
    public SystemViews.ErrorDetail error(@PathVariable long id) {
        return systemStatusService.error(id);
    }
}

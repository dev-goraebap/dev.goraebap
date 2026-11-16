package xyz.goraebap.foundation.outbox.application;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** The outbox lines that failed, for instance administrators to try again or drop. */
@RestController
@RequestMapping("/api/v1/system/outbox")
@PreAuthorize("hasAuthority('INSTANCE_ADMIN')")
@RequiredArgsConstructor
public class OutboxController {
    private final OutboxService outboxService;

    @GetMapping("/failed")
    public List<OutboxViews.FailedLine> failed() {
        return outboxService.failed();
    }

    @PostMapping("/failed/{id}/retry")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void retry(@PathVariable long id) {
        outboxService.retry(id);
    }

    @DeleteMapping("/failed/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void discard(@PathVariable long id) {
        outboxService.discard(id);
    }
}

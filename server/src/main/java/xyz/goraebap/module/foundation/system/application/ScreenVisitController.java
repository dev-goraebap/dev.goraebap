package xyz.goraebap.module.foundation.system.application;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.shared.web.ClientAddress;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * The screens tell the server which main screen a member opened, for the system status page. It only queues the
 * visit, so it never touches the business database and answers at once even while the log store fails.
 */
@RestController
@RequiredArgsConstructor
public class ScreenVisitController {
    private final ScreenVisitRecorder recorder;

    @PostMapping("/api/v1/system/visits")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void visit(
            @AuthenticationPrincipal CurrentUser user,
            @Valid @RequestBody SystemRequests.ScreenVisitReport report,
            HttpServletRequest request) {
        recorder.record(user.id(), report.screen(), ClientAddress.of(request), ClientAddress.agentOf(request));
    }
}

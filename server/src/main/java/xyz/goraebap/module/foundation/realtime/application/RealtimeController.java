package xyz.goraebap.module.foundation.realtime.application;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * One stream of server-sent events per open screen of a signed-in member. Each event is named "signal" and carries
 * {"topic": …, "id": …}; comments keep the stream alive. The browser's EventSource reconnects by itself when a stream
 * ends.
 */
@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class RealtimeController {
    private final RealtimeService realtimeService;

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter events(@AuthenticationPrincipal CurrentUser user, HttpServletResponse response) {
        // A proxy in front must pass events on as they come instead of holding them back.
        response.setHeader("X-Accel-Buffering", "no");
        return realtimeService.connect(user);
    }
}

package xyz.goraebap.productivity.issue.application.code;

import io.swagger.v3.oas.annotations.Hidden;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Where GitHub, GitLab and Gitea deliver their webhooks (BIT D-087). No session or token: a delivery counts only when
 * signed with its connection's secret, at most 5MB, and every refusal looks the same, so the address tells an outsider
 * nothing.
 */
@Hidden
@RestController
@RequiredArgsConstructor
public class HookController {
    private static final int MAX_BODY = 5 * 1024 * 1024;
    private final CodeInbound codeInbound;

    @PostMapping("/api/v1/hooks/{integrationId}")
    public ResponseEntity<Void> deliver(
            @PathVariable String integrationId,
            @RequestBody(required = false) byte[] body,
            HttpServletRequest request) {
        UUID id;
        try {
            id = UUID.fromString(integrationId);
        } catch (IllegalArgumentException invalid) {
            throw CodeErrorCode.HOOK_REJECTED.raise();
        }
        byte[] payload = body == null ? new byte[0] : body;
        if (payload.length > MAX_BODY) throw CodeErrorCode.HOOK_REJECTED.raise();
        var headers = new HashMap<String, String>();
        for (String name : Collections.list(request.getHeaderNames()))
            headers.put(name.toLowerCase(Locale.ROOT), request.getHeader(name));
        codeInbound.receive(id, headers, payload);
        return ResponseEntity.accepted().build();
    }
}

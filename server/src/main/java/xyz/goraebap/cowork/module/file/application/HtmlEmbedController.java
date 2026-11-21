package xyz.goraebap.cowork.module.file.application;

import io.swagger.v3.oas.annotations.Hidden;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.cowork.shared.error.CommonErrorCode;

/**
 * Serves an uploaded HTML file to a frame in a body. The signed link is the permission (HtmlEmbeds), so no session is
 * asked for, and the path has a security chain of its own (HtmlEmbedSecurityConfig) that sandboxes the page: it runs
 * its scripts without an origin, so it reads neither the session nor the app. Browsers reach it only through a
 * redirect from the owning module's file endpoint, so the OpenAPI document leaves it out.
 */
@Hidden
@RestController
@RequiredArgsConstructor
class HtmlEmbedController {
    private static final MediaType HTML = MediaType.parseMediaType("text/html;charset=UTF-8");

    private final FileService fileService;

    @GetMapping(HtmlEmbeds.PATH + "/{token}/{key}")
    ResponseEntity<Resource> open(@PathVariable String token, @PathVariable String key) {
        var page = fileService.openEmbed(token, key).orElseThrow(CommonErrorCode.COMMON_NOT_FOUND::raise);
        return ResponseEntity.ok()
                .contentType(HTML)
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePrivate())
                .body(new InputStreamResource(page));
    }
}

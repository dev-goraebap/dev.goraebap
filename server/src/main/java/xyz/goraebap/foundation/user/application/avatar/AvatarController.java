package xyz.goraebap.foundation.user.application.avatar;

import jakarta.validation.Valid;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.foundation.user.application.AuthErrorCode;
import xyz.goraebap.shared.web.CurrentUser;

/** Members' avatars for every screen that shows a person, and the signed-in member's own choice. */
@RestController
@RequiredArgsConstructor
public class AvatarController {
    /**
     * A picture's address holds its id, and a new picture gets a new id, so a browser may keep the bytes it has for
     * as long as it likes.
     */
    static final Duration PICTURE_CACHED = Duration.ofDays(365);

    private final AvatarService avatarService;

    @GetMapping("/api/v1/directory/avatars")
    public List<AvatarViews.AvatarItem> chosen() {
        return avatarService.chosen();
    }

    @GetMapping(value = "/api/v1/directory/avatars/{employeeId}/{pictureId}", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> picture(@PathVariable UUID employeeId, @PathVariable UUID pictureId) {
        return avatarService
                .picture(employeeId, pictureId)
                .map(file -> {
                    try (var body = file.body()) {
                        return ResponseEntity.ok()
                                .contentType(MediaType.IMAGE_JPEG)
                                .cacheControl(CacheControl.maxAge(PICTURE_CACHED)
                                        .cachePrivate()
                                        .immutable())
                                .body(body.readAllBytes());
                    } catch (IOException e) {
                        throw new UncheckedIOException(e);
                    }
                })
                .orElseThrow(AuthErrorCode.AUTH_NOT_FOUND::raise);
    }

    @PutMapping("/api/v1/me/avatar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void change(
            @AuthenticationPrincipal CurrentUser user, @Valid @RequestBody AvatarRequests.AvatarChange request) {
        avatarService.change(user, request);
    }
}

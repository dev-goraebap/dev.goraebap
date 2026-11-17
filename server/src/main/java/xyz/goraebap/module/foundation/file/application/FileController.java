package xyz.goraebap.module.foundation.file.application;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * Starts an upload. Opening a file goes through the module that owns it, which checks who may see it first; for
 * requests that is /api/v1/office/approval.
 */
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {
    private final FileService fileService;

    /**
     * Returns where to send the bytes. The body is an explicit exception to the empty 201 of shared guideline 01,
     * since the browser uses the URL and headers right away.
     */
    @PostMapping("/uploads")
    @ResponseStatus(HttpStatus.CREATED)
    public FileViews.UploadTicket upload(
            @AuthenticationPrincipal CurrentUser user, @Valid @RequestBody FileRequests.Upload request) {
        return fileService.prepare(user, request);
    }
}

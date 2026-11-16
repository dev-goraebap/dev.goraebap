package xyz.goraebap.workspace.document.application.activity;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import xyz.goraebap.workspace.activity.ActivityFacade;

public final class BodyActivityRequests {
    private BodyActivityRequests() {}

    /**
     * What a comment says, plain text, the words of the body it was written on (the start of the block's words for a
     * comment on a block), the comment it replies to, and the block of the body it sits on (a top-level block's id; a
     * reply follows the comment it answers).
     */
    @Schema(name = "BodyCommentInput")
    public record CommentInput(
            @NotBlank @Size(max = ActivityFacade.COMMENT_MAX) String body,

            @Size(max = ActivityFacade.QUOTE_MAX) String quote,
            UUID parentId,
            @Size(max = 64) String blockId) {
        public CommentInput(String body, String quote, UUID parentId) {
            this(body, quote, parentId, null);
        }
    }

    /** Whether a thread is resolved. */
    @Schema(name = "CommentResolution")
    public record Resolution(boolean resolved) {}

    /** A comment's new text. */
    @Schema(name = "BodyCommentEdit")
    public record CommentEdit(
            @NotBlank @Size(max = ActivityFacade.COMMENT_MAX) String body) {}
}

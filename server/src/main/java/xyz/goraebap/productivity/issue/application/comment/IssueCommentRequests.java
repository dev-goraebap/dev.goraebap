package xyz.goraebap.productivity.issue.application.comment;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import xyz.goraebap.productivity.activity.ActivityFacade;

public final class IssueCommentRequests {
    private IssueCommentRequests() {}

    /**
     * What a comment says, plain text, the words of the body it was written on (when it was; kept as written), and the
     * comment it replies to (when it is a reply).
     */
    public record CommentInput(
            @NotBlank @Size(max = ActivityFacade.COMMENT_MAX) String body,

            @Size(max = ActivityFacade.QUOTE_MAX) String quote,
            UUID parentId,
            /** The block of the body the comment sits on (a top-level block's id; a reply follows its thread). */
            @Size(max = 64) String blockId) {
        public CommentInput(String body) {
            this(body, null, null, null);
        }

        public CommentInput(String body, String quote, UUID parentId) {
            this(body, quote, parentId, null);
        }
    }

    /** Whether a thread is resolved. */
    @Schema(name = "IssueCommentResolution")
    public record Resolution(boolean resolved) {}
}

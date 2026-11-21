package xyz.goraebap.productivity.document.application.activity;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;
import xyz.goraebap.productivity.activity.ActivityEntry;

public final class BodyActivityViews {
    private BodyActivityViews() {}

    /**
     * One entry of a document's or a chapter's timeline, oldest first, by whom (by name) and when: a comment (its text, the
     * words of the body it quotes, the comment it replies to, when it was edited) or something that happened (its field, BODY for a save of the body,
     * and its values before and after).
     */
    @Schema(
            name = "BodyActivityEntry",
            requiredProperties = {"kind", "id", "at"})
    public record Entry(
            ActivityEntry.Kind kind,
            UUID id,
            Instant at,
            UUID actorId,
            String actorName,
            String body,
            String quote,
            UUID parentId,
            Instant editedAt,
            String field,
            String before,
            String after,
            xyz.goraebap.shared.web.AgentActor agent,
            /** The block of the body a thread's first comment sits on (a reply follows its thread). */
            String blockId,
            /** When the thread a first comment starts was resolved, and by whom (null while it is open). */
            Instant resolvedAt,
            String resolvedByName) {}
}

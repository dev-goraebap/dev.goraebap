package xyz.goraebap.productivity.richbody;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * A body written in the shared body editor (cowork-guide-design-system, 본문 뷰어/에디터) for an owner of another module,
 * an issue or a document. The owner checks who may read and write before asking; this keeps the body and its
 * versions, puts each change on the owner's timeline (the common activity, BODY), and binds the files the body shows to
 * the owner. A body never written reads as none at version 0.
 */
public interface RichBodyFacade {
    @Schema(name = "RichBodyEditor")
    record Editor(UUID userId, String name, Instant startedAt) {}

    List<Editor> editors(RichBodyOwner owner);

    void editing(RichBodyOwner owner, UUID user, UUID lease);

    void stopEditing(RichBodyOwner owner, UUID user, UUID lease);

    RichBodyState read(RichBodyOwner owner);

    /** One kept version with its body (the body read answers the versions without theirs: a long body's list was heavy). */
    RichBodyState.BodyVersion version(RichBodyOwner owner, UUID revisionId);

    /**
     * Saves the body over the version it was read at (RICH_BODY_VERSION_CONFLICT when it changed since), keeping the body
     * before its first change as a version, and this one too when asked for a checkpoint.
     */
    RichBodyState save(RichBodyOwner owner, UUID actor, RichBodyEdit edit);

    /**
     * Saves the body's changed blocks over the block versions read (RICH_BODY_BLOCK_CONFLICT when one of them changed
     * since); blocks changed elsewhere that the save does not touch are kept.
     */
    RichBodyState patch(RichBodyOwner owner, UUID actor, RichBodyPatch patch);

    /** Versioned whole-body replacement, preserving opaque blocks and media attributes and binding pending uploads. */
    RichBodyState replace(RichBodyOwner owner, UUID actor, Map<String, Object> body, List<String> dropBlocks);

    /**
     * Replaces a run of top-level blocks (range, in order; empty to insert after the block given, null for the start)
     * with the blocks of replacement (from Markdown: opaque blocks of the run come back by their marks, as replace does).
     * Read at expectedVersion (null for the version now), the replacement is refused (RICH_BODY_BLOCK_CONFLICT) only when
     * a block of the run, or a block since deleted, changed after it: changes elsewhere in the body stay.
     */
    RichBodyState replaceBlocks(
            RichBodyOwner owner,
            UUID actor,
            List<String> range,
            String after,
            Map<String, Object> replacement,
            List<String> dropBlocks,
            Long expectedVersion);

    /** Makes a kept version the body again, as a new version over the one read: the body before is kept first. */
    RichBodyState restore(RichBodyOwner owner, UUID actor, UUID revisionId, long expectedVersion);

    /**
     * A body written in Markdown (CommonMark with GFM tables, task lists, strikethrough and alerts) as the editor's
     * JSON, to save as any other body: for bodies that come from elsewhere, imports and agents.
     */
    Map<String, Object> fromMarkdown(String markdown);

    /** A body's words as plain text, a line for each block, to search it or show a line of it. */
    String plainText(Map<String, Object> body);
}

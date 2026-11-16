package xyz.goraebap.workspace.activity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * The timeline of anything with a body (결정기록 2026-11-04 공통 활동), for an owner of another module: what happened to
 * it and the discussion under it, oldest first. The owner checks who may read and write before asking; this keeps the
 * entries and who may change a comment (its writer edits it; its writer, or a moderator the owner names, deletes it).
 */
public interface ActivityFacade {
    /** The most a comment says, and the most of the body it quotes, in letters. */
    int COMMENT_MAX = 10_000;

    int QUOTE_MAX = 2_000;

    List<ActivityEntry> timeline(ActivityOwner owner);

    void record(ActivityOwner owner, List<ActivityEvent> events);

    /**
     * A comment written by author at the given moment (now for the screens, the original moment for importers), quoting
     * the words of the body it was written on when quote is given, and replying to parentId when given (one level: a
     * reply to a reply answers the same comment; ACTIVITY_COMMENT_NOT_FOUND when it is not a live comment of the owner).
     */
    default UUID comment(ActivityOwner owner, UUID author, Instant at, String body, String quote, UUID parentId) {
        return comment(owner, author, at, body, quote, parentId, null);
    }

    /**
     * The same, on a block of the owner's body when blockId is given (a top-level block's id; a reply follows the block
     * of the comment it answers). quote keeps the start of the block's words, so the comment still reads once it goes.
     */
    UUID comment(
            ActivityOwner owner, UUID author, Instant at, String body, String quote, UUID parentId, String blockId);

    /** Resolves the thread a comment starts, or opens it again (ACTIVITY_COMMENT_NOT_FOUND for a reply or a gone one). */
    void resolveThread(ActivityOwner owner, UUID commentId, UUID actor, boolean resolved);

    void editComment(ActivityOwner owner, UUID commentId, UUID actor, String body);

    void deleteComment(ActivityOwner owner, UUID commentId, UUID actor, boolean moderator);
}

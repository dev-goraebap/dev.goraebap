package xyz.goraebap.workspace.activity.domain;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.workspace.activity.ActivityFacade;
import xyz.goraebap.foundation.shared.error.DomainRuleViolation;

/**
 * A comment on an owner's timeline, plain text, perhaps quoting words of the owner's body, perhaps replying to another
 * comment (one level); its writer edits it, and it is deleted but kept for the record. A thread's first comment may sit
 * on a block of the body (its blockId, a top-level block) and be resolved; a reply follows its thread's first comment.
 */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ActivityComment {
    private static final int BODY_MAX = ActivityFacade.COMMENT_MAX;
    private static final int QUOTE_MAX = ActivityFacade.QUOTE_MAX;
    private static final int BLOCK_ID_MAX = 64;

    @EqualsAndHashCode.Include
    private final UUID id;

    private final String ownerType;
    private final UUID ownerId;
    private String body;
    private final String quote;
    private final UUID parentId;
    private final String blockId;
    private final UUID authorId;
    private final Instant createdAt;
    private Instant editedAt;
    private Instant deletedAt;
    private Instant resolvedAt;
    private UUID resolvedBy;

    public static ActivityComment create(
            UUID id,
            String ownerType,
            UUID ownerId,
            String body,
            String quote,
            UUID parentId,
            String blockId,
            UUID authorId,
            Instant now) {
        String block = parentId != null || blockId == null || blockId.isBlank() ? null : blockId.strip();
        if (block != null && block.length() > BLOCK_ID_MAX) throw new DomainRuleViolation("블록 id가 너무 깁니다");
        return new ActivityComment(
                id,
                ownerType,
                ownerId,
                checked(body),
                quoted(quote),
                parentId,
                block,
                authorId,
                now,
                null,
                null,
                null,
                null);
    }

    public static ActivityComment fromPersistence(
            UUID id,
            String ownerType,
            UUID ownerId,
            String body,
            String quote,
            UUID parentId,
            String blockId,
            UUID authorId,
            Instant createdAt,
            Instant editedAt,
            Instant deletedAt,
            Instant resolvedAt,
            UUID resolvedBy) {
        return new ActivityComment(
                id,
                ownerType,
                ownerId,
                body,
                quote,
                parentId,
                blockId,
                authorId,
                createdAt,
                editedAt,
                deletedAt,
                resolvedAt,
                resolvedBy);
    }

    /** The comment a reply to this one answers: this one, or the one it answers itself (replies are one level). */
    public UUID threadId() {
        return parentId == null ? id : parentId;
    }

    public void edit(String body, Instant now) {
        if (deletedAt != null) throw new DomainRuleViolation("삭제한 댓글입니다");
        this.body = checked(body);
        this.editedAt = now;
    }

    /** Resolves the thread this comment starts (or opens it again); a reply has no thread of its own. */
    public void resolve(boolean resolved, UUID actor, Instant now) {
        if (parentId != null) throw new DomainRuleViolation("스레드의 첫 댓글만 해결할 수 있습니다");
        if (deletedAt != null) throw new DomainRuleViolation("삭제한 댓글입니다");
        resolvedAt = resolved ? now : null;
        resolvedBy = resolved ? actor : null;
    }

    public void delete(Instant now) {
        if (deletedAt == null) deletedAt = now;
    }

    public boolean isWrittenBy(UUID userId) {
        return authorId.equals(userId);
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public boolean belongsTo(String type, UUID id) {
        return ownerType.equals(type) && ownerId.equals(id);
    }

    private static String checked(String body) {
        String text = body == null ? "" : body.strip();
        if (text.isEmpty() || text.length() > BODY_MAX) throw new DomainRuleViolation("댓글은 1~10000자입니다");
        return text;
    }

    private static String quoted(String quote) {
        String text = quote == null ? "" : quote.strip();
        if (text.isEmpty()) return null;
        return text.length() <= QUOTE_MAX ? text : text.substring(0, QUOTE_MAX);
    }
}

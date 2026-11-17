package xyz.goraebap.module.workspace.activity;

import java.time.Instant;
import java.util.UUID;
import xyz.goraebap.shared.web.AgentActor;

/**
 * One entry of an owner's timeline, by whom and when: an event (its field and values before and after) or a comment (its
 * text, the words of the body it quotes, when it was edited, and the comment it replies to, if it is a reply). A thread's
 * first comment may sit on a block of the body (blockId) and be resolved (when, by whom).
 */
public record ActivityEntry(
        Kind kind,
        UUID id,
        Instant at,
        UUID actorId,
        String field,
        String before,
        String after,
        String body,
        String quote,
        Instant editedAt,
        UUID parentId,
        AgentActor agent,
        String blockId,
        Instant resolvedAt,
        UUID resolvedBy) {
    public ActivityEntry withAgentName(String name) {
        if (agent == null || name == null || name.equals(agent.name())) return this;
        return new ActivityEntry(
                kind,
                id,
                at,
                actorId,
                field,
                before,
                after,
                body,
                quote,
                editedAt,
                parentId,
                new AgentActor(agent.id(), name, agent.icon(), agent.color()),
                blockId,
                resolvedAt,
                resolvedBy);
    }

    public enum Kind {
        EVENT,
        COMMENT
    }
}

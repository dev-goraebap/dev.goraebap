package xyz.goraebap.module.workspace.activity.infrastructure;

import static xyz.goraebap.jooq.tables.ActivityEntry.ACTIVITY_ENTRY;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.module.workspace.activity.ActivityActor;
import xyz.goraebap.module.workspace.activity.ActivityEntry;
import xyz.goraebap.module.workspace.activity.ActivityEvent;
import xyz.goraebap.module.workspace.activity.ActivityOwner;
import xyz.goraebap.module.workspace.activity.domain.ActivityComment;
import xyz.goraebap.module.workspace.activity.domain.ActivityRepository;
import xyz.goraebap.shared.web.AgentActor;

@Repository
@RequiredArgsConstructor
class JooqActivityRepository implements ActivityRepository {
    private static final String EVENT = ActivityEntry.Kind.EVENT.name();
    private static final String COMMENT = ActivityEntry.Kind.COMMENT.name();

    private final DSLContext dslContext;

    @Override
    public List<ActivityEntry> findTimeline(ActivityOwner owner) {
        return dslContext
                .selectFrom(ACTIVITY_ENTRY)
                .where(ACTIVITY_ENTRY.OWNER_ID.eq(owner.id()))
                .and(ACTIVITY_ENTRY.OWNER_TYPE.eq(owner.type()))
                .and(ACTIVITY_ENTRY.DELETED_AT.isNull())
                .orderBy(ACTIVITY_ENTRY.CREATED_AT, ACTIVITY_ENTRY.ENTRY_ID)
                .fetch(row -> new ActivityEntry(
                        ActivityEntry.Kind.valueOf(row.getKind()),
                        row.getEntryId(),
                        row.getCreatedAt(),
                        row.getCreatedBy(),
                        row.getField(),
                        row.getBeforeValue(),
                        row.getAfterValue(),
                        row.getBody(),
                        row.getQuote(),
                        row.getEditedAt(),
                        row.getParentId(),
                        row.getAgentProfileId() == null
                                ? null
                                : new AgentActor(
                                        row.getAgentProfileId(),
                                        row.getAgentName(),
                                        row.getAgentIcon(),
                                        row.getAgentColor()),
                        row.getBlockId(),
                        row.getResolvedAt(),
                        row.getResolvedBy()));
    }

    @Override
    public void saveEvents(ActivityOwner owner, List<ActivityEvent> events, ActivityActor actor) {
        var writes = new java.util.ArrayList<org.jooq.Query>();
        for (var event : events) {
            var agent = event.actorId() != null && event.actorId().equals(actor.userId()) ? actor.agent() : null;
            writes.add(dslContext
                    .insertInto(ACTIVITY_ENTRY)
                    .set(ACTIVITY_ENTRY.ENTRY_ID, UUID.randomUUID())
                    .set(ACTIVITY_ENTRY.OWNER_TYPE, owner.type())
                    .set(ACTIVITY_ENTRY.OWNER_ID, owner.id())
                    .set(ACTIVITY_ENTRY.KIND, EVENT)
                    .set(ACTIVITY_ENTRY.FIELD, event.field())
                    .set(ACTIVITY_ENTRY.BEFORE_VALUE, event.before())
                    .set(ACTIVITY_ENTRY.AFTER_VALUE, event.after())
                    .set(ACTIVITY_ENTRY.CREATED_AT, event.at())
                    .set(ACTIVITY_ENTRY.CREATED_BY, event.actorId())
                    .set(
                            ACTIVITY_ENTRY.ACTOR_SOURCE,
                            event.actorId() != null && event.actorId().equals(actor.userId()) ? actor.source() : null)
                    .set(ACTIVITY_ENTRY.AGENT_PROFILE_ID, agent == null ? null : agent.id())
                    .set(ACTIVITY_ENTRY.AGENT_NAME, agent == null ? null : agent.name())
                    .set(ACTIVITY_ENTRY.AGENT_ICON, agent == null ? null : agent.icon())
                    .set(ACTIVITY_ENTRY.AGENT_COLOR, agent == null ? null : agent.color()));
        }
        if (!writes.isEmpty()) dslContext.batch(writes).execute();
    }

    @Override
    public Optional<ActivityComment> findComment(UUID id) {
        return dslContext
                .selectFrom(ACTIVITY_ENTRY)
                .where(ACTIVITY_ENTRY.ENTRY_ID.eq(id).and(ACTIVITY_ENTRY.KIND.eq(COMMENT)))
                .fetchOptional(row -> ActivityComment.fromPersistence(
                        row.getEntryId(),
                        row.getOwnerType(),
                        row.getOwnerId(),
                        row.getBody(),
                        row.getQuote(),
                        row.getParentId(),
                        row.getBlockId(),
                        row.getCreatedBy(),
                        row.getCreatedAt(),
                        row.getEditedAt(),
                        row.getDeletedAt(),
                        row.getResolvedAt(),
                        row.getResolvedBy()));
    }

    @Override
    public void saveComment(ActivityComment comment, ActivityActor actor) {
        var agent = actor.agent();
        dslContext
                .insertInto(ACTIVITY_ENTRY)
                .set(ACTIVITY_ENTRY.ENTRY_ID, comment.id())
                .set(ACTIVITY_ENTRY.OWNER_TYPE, comment.ownerType())
                .set(ACTIVITY_ENTRY.OWNER_ID, comment.ownerId())
                .set(ACTIVITY_ENTRY.KIND, COMMENT)
                .set(ACTIVITY_ENTRY.BODY, comment.body())
                .set(ACTIVITY_ENTRY.QUOTE, comment.quote())
                .set(ACTIVITY_ENTRY.PARENT_ID, comment.parentId())
                .set(ACTIVITY_ENTRY.BLOCK_ID, comment.blockId())
                .set(ACTIVITY_ENTRY.RESOLVED_AT, comment.resolvedAt())
                .set(ACTIVITY_ENTRY.RESOLVED_BY, comment.resolvedBy())
                .set(ACTIVITY_ENTRY.CREATED_AT, comment.createdAt())
                .set(ACTIVITY_ENTRY.CREATED_BY, comment.authorId())
                .set(ACTIVITY_ENTRY.ACTOR_SOURCE, actor.source())
                .set(ACTIVITY_ENTRY.AGENT_PROFILE_ID, agent == null ? null : agent.id())
                .set(ACTIVITY_ENTRY.AGENT_NAME, agent == null ? null : agent.name())
                .set(ACTIVITY_ENTRY.AGENT_ICON, agent == null ? null : agent.icon())
                .set(ACTIVITY_ENTRY.AGENT_COLOR, agent == null ? null : agent.color())
                .set(ACTIVITY_ENTRY.EDITED_AT, comment.editedAt())
                .set(ACTIVITY_ENTRY.DELETED_AT, comment.deletedAt())
                .onConflict(ACTIVITY_ENTRY.ENTRY_ID)
                .doUpdate()
                .set(ACTIVITY_ENTRY.BODY, comment.body())
                .set(ACTIVITY_ENTRY.EDITED_AT, comment.editedAt())
                .set(ACTIVITY_ENTRY.DELETED_AT, comment.deletedAt())
                .set(ACTIVITY_ENTRY.RESOLVED_AT, comment.resolvedAt())
                .set(ACTIVITY_ENTRY.RESOLVED_BY, comment.resolvedBy())
                .execute();
    }
}

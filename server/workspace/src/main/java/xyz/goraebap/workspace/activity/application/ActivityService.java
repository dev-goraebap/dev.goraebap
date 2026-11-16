package xyz.goraebap.workspace.activity.application;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.foundation.user.UserFacade;
import xyz.goraebap.workspace.activity.ActivityActor;
import xyz.goraebap.workspace.activity.ActivityEntry;
import xyz.goraebap.workspace.activity.ActivityEvent;
import xyz.goraebap.workspace.activity.ActivityFacade;
import xyz.goraebap.workspace.activity.ActivityOwner;
import xyz.goraebap.workspace.activity.domain.ActivityComment;
import xyz.goraebap.workspace.activity.domain.ActivityRepository;
import xyz.goraebap.foundation.shared.web.CurrentUser;

@Service
@RequiredArgsConstructor
public class ActivityService implements ActivityFacade {
    private final ActivityRepository activityRepository;
    private final Clock clock;
    private final UserFacade userFacade;

    @Override
    @Transactional(readOnly = true)
    public List<ActivityEntry> timeline(ActivityOwner owner) {
        var entries = activityRepository.findTimeline(owner);
        var profileIds = entries.stream()
                .filter(entry -> entry.agent() != null)
                .map(entry -> entry.agent().id())
                .distinct()
                .toList();
        if (profileIds.isEmpty()) return entries;
        var names = userFacade.agentNamesOf(profileIds);
        return entries.stream()
                .map(entry -> entry.agent() == null
                        ? entry
                        : entry.withAgentName(names.get(entry.agent().id())))
                .toList();
    }

    @Override
    @Transactional
    public void record(ActivityOwner owner, List<ActivityEvent> events) {
        if (!events.isEmpty())
            activityRepository.saveEvents(owner, events, actor(events.getFirst().actorId()));
    }

    @Override
    @Transactional
    public UUID comment(
            ActivityOwner owner, UUID author, Instant at, String body, String quote, UUID parentId, String blockId) {
        UUID thread = parentId == null ? null : commentOf(owner, parentId).threadId();
        var comment = ActivityComment.create(
                UUID.randomUUID(), owner.type(), owner.id(), body, quote, thread, blockId, author, at);
        activityRepository.saveComment(comment, actor(comment.authorId()));
        return comment.id();
    }

    @Override
    @Transactional
    public void editComment(ActivityOwner owner, UUID commentId, UUID actor, String body) {
        var comment = commentOf(owner, commentId);
        if (!comment.isWrittenBy(actor)) throw new AccessDeniedException("자신이 쓴 댓글만 고칠 수 있습니다");
        comment.edit(body, clock.instant());
        activityRepository.saveComment(comment, actor(comment.authorId()));
        record(owner, List.of(new ActivityEvent("COMMENT_EDITED", null, null, clock.instant(), actor)));
    }

    @Override
    @Transactional
    public void resolveThread(ActivityOwner owner, UUID commentId, UUID actor, boolean resolved) {
        var comment = commentOf(owner, commentId);
        if (comment.parentId() != null) throw ActivityErrorCode.ACTIVITY_COMMENT_NOT_FOUND.raise();
        if ((comment.resolvedAt() != null) == resolved) return;
        comment.resolve(resolved, actor, clock.instant());
        activityRepository.saveComment(comment, actor(comment.authorId()));
        record(
                owner,
                List.of(new ActivityEvent(
                        resolved ? "COMMENT_RESOLVED" : "COMMENT_REOPENED", null, null, clock.instant(), actor)));
    }

    @Override
    @Transactional
    public void deleteComment(ActivityOwner owner, UUID commentId, UUID actor, boolean moderator) {
        var comment = commentOf(owner, commentId);
        if (!comment.isWrittenBy(actor) && !moderator) throw new AccessDeniedException("자신이 쓴 댓글만 지울 수 있습니다");
        comment.delete(clock.instant());
        activityRepository.saveComment(comment, actor(comment.authorId()));
        record(owner, List.of(new ActivityEvent("COMMENT_DELETED", null, null, clock.instant(), actor)));
    }

    private static ActivityActor actor(UUID id) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null
                && auth.getPrincipal() instanceof CurrentUser user
                && user.id().equals(id))
            return new ActivityActor(id, user.agent() ? "MCP" : "USER", user.agentProfile());
        return new ActivityActor(id, null, null);
    }

    private ActivityComment commentOf(ActivityOwner owner, UUID commentId) {
        return activityRepository
                .findComment(commentId)
                .filter(comment -> comment.belongsTo(owner.type(), owner.id()) && !comment.isDeleted())
                .orElseThrow(ActivityErrorCode.ACTIVITY_COMMENT_NOT_FOUND::raise);
    }
}

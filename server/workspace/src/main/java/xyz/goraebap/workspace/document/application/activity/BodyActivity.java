package xyz.goraebap.workspace.document.application.activity;

import java.time.Clock;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import xyz.goraebap.workspace.WorkspaceTransactional;
import xyz.goraebap.foundation.user.UserFacade;
import xyz.goraebap.workspace.activity.ActivityFacade;
import xyz.goraebap.workspace.activity.ActivityOwner;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/**
 * The timeline of a document's or a chapter's body (the common activity): what happened to it and the discussion under
 * it. The document's or the chapter's service checks who may read and write first; a writer edits their own comment,
 * and deletes it, as a Workspace administrator may delete any.
 */
@Service
@RequiredArgsConstructor
public class BodyActivity {
    private final ActivityFacade activityFacade;
    private final UserFacade userFacade;
    private final Clock clock;

    @WorkspaceTransactional(readOnly = true)
    public List<BodyActivityViews.Entry> timeline(ActivityOwner owner) {
        var entries = activityFacade.timeline(owner);
        var people = new HashSet<UUID>();
        entries.forEach(entry -> {
            people.add(entry.actorId());
            people.add(entry.resolvedBy());
        });
        people.remove(null);
        var names = userFacade.summariesOf(people);
        return entries.stream()
                .map(entry -> new BodyActivityViews.Entry(
                        entry.kind(),
                        entry.id(),
                        entry.at(),
                        entry.actorId(),
                        entry.actorId() != null && names.containsKey(entry.actorId())
                                ? names.get(entry.actorId()).name()
                                : null,
                        entry.body(),
                        entry.quote(),
                        entry.parentId(),
                        entry.editedAt(),
                        entry.field(),
                        entry.before(),
                        entry.after(),
                        entry.agent(),
                        entry.blockId(),
                        entry.resolvedAt(),
                        entry.resolvedBy() != null && names.containsKey(entry.resolvedBy())
                                ? names.get(entry.resolvedBy()).name()
                                : null))
                .toList();
    }

    @WorkspaceTransactional
    public UUID comment(ActivityOwner owner, CurrentUser user, BodyActivityRequests.CommentInput request) {
        return activityFacade.comment(
                owner,
                user.id(),
                clock.instant(),
                request.body(),
                request.quote(),
                request.parentId(),
                request.blockId());
    }

    @WorkspaceTransactional
    public void resolve(
            ActivityOwner owner, CurrentUser user, UUID commentId, BodyActivityRequests.Resolution request) {
        activityFacade.resolveThread(owner, commentId, user.id(), request.resolved());
    }

    @WorkspaceTransactional
    public void edit(ActivityOwner owner, CurrentUser user, UUID commentId, BodyActivityRequests.CommentEdit request) {
        activityFacade.editComment(owner, commentId, user.id(), request.body());
    }

    @WorkspaceTransactional
    /** Deletes a comment: its writer's, or anyone's for who moderates the place (its project's administrators). */
    public void delete(ActivityOwner owner, CurrentUser user, UUID commentId, boolean moderates) {
        activityFacade.deleteComment(owner, commentId, user.id(), moderates);
    }
}

package xyz.goraebap.workspace.issue.application.comment;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import xyz.goraebap.workspace.WorkspaceTransactional;
import xyz.goraebap.workspace.activity.ActivityFacade;
import xyz.goraebap.workspace.activity.ActivityOwner;
import xyz.goraebap.workspace.issue.application.IssueErrorCode;
import xyz.goraebap.workspace.issue.application.IssueProjects;
import xyz.goraebap.workspace.issue.application.body.IssueBodyService;
import xyz.goraebap.workspace.issue.domain.issue.Issue;
import xyz.goraebap.workspace.issue.domain.issue.IssueRepository;
import xyz.goraebap.workspace.project.ProjectRole;
import xyz.goraebap.workspace.project.ProjectSummary;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/**
 * An issue's discussion on its timeline (the common activity; BIT's comments, plain text, perhaps quoting words of the
 * body): any member writes while the project is not archived; a writer edits their own comment, and deletes it, as a
 * Workspace administrator may delete any.
 */
@Service
@RequiredArgsConstructor
public class IssueCommentService {
    private final ActivityFacade activityFacade;
    private final IssueRepository issueRepository;
    private final IssueProjects issueProjects;
    private final Clock clock;

    @WorkspaceTransactional
    public UUID add(CurrentUser user, String key, long number, IssueCommentRequests.CommentInput request) {
        return comment(issueProjects.commentable(user, key), user.id(), clock.instant(), number, request);
    }

    /**
     * A comment written by author at the given moment, for importers, which keep when and by whom what they bring was
     * written and need no rights.
     */
    @WorkspaceTransactional
    public UUID add(UUID author, Instant at, String key, long number, IssueCommentRequests.CommentInput request) {
        return comment(issueProjects.open(key), author, at, number, request);
    }

    private UUID comment(
            ProjectSummary project, UUID author, Instant at, long number, IssueCommentRequests.CommentInput request) {
        UUID id = activityFacade.comment(
                ownerOf(issueOf(project, number)),
                author,
                at,
                request.body(),
                request.quote(),
                request.parentId(),
                request.blockId());
        issueProjects.signal(project);
        return id;
    }

    @WorkspaceTransactional
    public void edit(
            CurrentUser user, String key, long number, UUID commentId, IssueCommentRequests.CommentInput request) {
        var project = issueProjects.commentable(user, key);
        activityFacade.editComment(ownerOf(issueOf(project, number)), commentId, user.id(), request.body());
        issueProjects.signal(project);
    }

    @WorkspaceTransactional
    public void resolve(
            CurrentUser user, String key, long number, UUID commentId, IssueCommentRequests.Resolution request) {
        var project = issueProjects.commentable(user, key);
        activityFacade.resolveThread(ownerOf(issueOf(project, number)), commentId, user.id(), request.resolved());
        issueProjects.signal(project);
    }

    @WorkspaceTransactional
    public void delete(CurrentUser user, String key, long number, UUID commentId) {
        var project = issueProjects.commentable(user, key);
        activityFacade.deleteComment(
                ownerOf(issueOf(project, number)),
                commentId,
                user.id(),
                issueProjects.roleOf(user, project).atLeast(ProjectRole.ADMIN));
        issueProjects.signal(project);
    }

    private Issue issueOf(ProjectSummary project, long number) {
        return issueRepository
                .findByProjectIdAndNumber(project.id(), number)
                .filter(issue -> !issue.isDeleted())
                .orElseThrow(IssueErrorCode.ISSUE_NOT_FOUND::raise);
    }

    private static ActivityOwner ownerOf(Issue issue) {
        return new ActivityOwner(IssueBodyService.OWNER_TYPE, issue.id());
    }
}

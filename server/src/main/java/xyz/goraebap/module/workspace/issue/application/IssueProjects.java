package xyz.goraebap.module.workspace.issue.application;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import xyz.goraebap.module.foundation.realtime.RealtimeFacade;
import xyz.goraebap.module.foundation.realtime.Signal;
import xyz.goraebap.module.workspace.project.ProjectAccess;
import xyz.goraebap.module.workspace.project.ProjectFacade;
import xyz.goraebap.module.workspace.project.ProjectRole;
import xyz.goraebap.module.workspace.project.ProjectSummary;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * Who may do what with a project's issues, as {@link ProjectAccess} judges it: a project's
 * viewers read its issues, cycles and board and comment, its editors also write issues, bodies, time and cycles, and its
 * administrators also keep its board, cycles' settings, repositories and shared views. Who does not see the project does
 * not find it (404); a role too low to write is refused (403). An archived project is read and not written (409); a
 * deleted one is not found. Each change tells who sees the project.
 */
@Component
@RequiredArgsConstructor
public class IssueProjects {
    private final ProjectFacade projectFacade;
    private final ProjectAccess projectAccess;
    private final RealtimeFacade realtimeFacade;

    /** The live project a key names, its current key or an old one, for one of who sees it. */
    public ProjectSummary readable(CurrentUser user, String key) {
        var project = live(key);
        if (!roleOf(user, project).atLeast(ProjectRole.VIEWER)) throw IssueErrorCode.ISSUE_PROJECT_NOT_FOUND.raise();
        return project;
    }

    /** The project a key names, to comment on its issues: one of who sees it, the project not archived. */
    public ProjectSummary commentable(CurrentUser user, String key) {
        return unarchived(readable(user, key));
    }

    /** The project a key names, to change its issues: an editor and up, the project not archived. */
    public ProjectSummary writable(CurrentUser user, String key) {
        return least(user, unarchived(readable(user, key)), ProjectRole.EDITOR, "에디터 이상만 할 수 있습니다");
    }

    /** The project a key names, for its administrators to change its board, settings or shared views. */
    public ProjectSummary administered(CurrentUser user, String key) {
        return least(user, unarchived(readable(user, key)), ProjectRole.ADMIN, "프로젝트 관리자만 할 수 있습니다");
    }

    /** The user's role in the project: ADMIN for a Workspace administrator, NONE when they do not see it. */
    public ProjectRole roleOf(CurrentUser user, ProjectSummary project) {
        return projectAccess.roleOf(project.id(), user);
    }

    /** The user's role in the project of this id. */
    public ProjectRole roleOf(CurrentUser user, UUID projectId) {
        return projectAccess.roleOf(projectId, user);
    }

    /** Whether the user may change the project's issues: an editor and up, the project not archived. */
    public boolean canWrite(CurrentUser user, ProjectSummary project) {
        return !project.archived() && roleOf(user, project).atLeast(ProjectRole.EDITOR);
    }

    /** The projects whose issues the user sees. */
    public ProjectAccess.Visible visibleTo(CurrentUser user) {
        return projectAccess.visibleTo(user);
    }

    /** The live project a key names whoever asks, for importers, which bring their own people and need no rights. */
    public ProjectSummary live(String key) {
        return projectFacade
                .findByKey(key)
                .filter(project -> !project.deleted())
                .orElseThrow(IssueErrorCode.ISSUE_PROJECT_NOT_FOUND::raise);
    }

    /** The live, unarchived project a key names whoever asks, for importers and repositories' webhooks. */
    public ProjectSummary open(String key) {
        return unarchived(live(key));
    }

    /** Whether the project of this id is live, archived or not. */
    public boolean exists(UUID projectId) {
        return projectFacade.exists(projectId);
    }

    /** Tells who sees the project that its issues, board or labels changed. */
    public void signal(ProjectSummary project) {
        signal(project.id());
    }

    /** The same, for the project of this id. */
    public void signal(UUID projectId) {
        realtimeFacade.signal(Signal.to(Signal.Topic.ISSUES, projectId, projectAccess.viewersOf(projectId)));
    }

    /** The issue's reference as people say it: the project's current key and the number, P1-3. */
    public static String ref(ProjectSummary project, long number) {
        return project.key() + "-" + number;
    }

    private ProjectSummary least(CurrentUser user, ProjectSummary project, ProjectRole least, String refusal) {
        if (!roleOf(user, project).atLeast(least)) throw new AccessDeniedException(refusal);
        return project;
    }

    private static ProjectSummary unarchived(ProjectSummary project) {
        if (project.archived()) throw IssueErrorCode.ISSUE_PROJECT_ARCHIVED.raise();
        return project;
    }
}

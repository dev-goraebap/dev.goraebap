package xyz.goraebap.workspace.issue.application.body;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.foundation.file.FileFacade;
import xyz.goraebap.workspace.issue.application.IssueErrorCode;
import xyz.goraebap.workspace.issue.application.IssueProjects;
import xyz.goraebap.workspace.issue.domain.issue.Issue;
import xyz.goraebap.workspace.issue.domain.issue.IssueRepository;
import xyz.goraebap.workspace.project.ProjectSummary;
import xyz.goraebap.workspace.richbody.RichBodyFacade;
import xyz.goraebap.workspace.richbody.RichBodyOwner;
import xyz.goraebap.workspace.richbody.RichBodyPatch;
import xyz.goraebap.workspace.richbody.RichBodyState;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/**
 * An issue's body in the shared body editor (RichBody): every member reads it with its versions and activity,
 * any member writes it and comments in it while the project is not archived. The files it shows are the issue's
 * (PROJECT_ISSUE) and open through the issue, so whoever reads the issue sees them.
 */
@Service
@RequiredArgsConstructor
public class IssueBodyService {
    /** The file owner type of an issue's body files. */
    public static final String OWNER_TYPE = "PROJECT_ISSUE";

    private final RichBodyFacade richBodyFacade;
    private final IssueRepository issueRepository;
    private final IssueProjects issueProjects;
    private final FileFacade fileFacade;

    @Transactional(readOnly = true)
    public List<RichBodyFacade.Editor> editors(CurrentUser user, String key, long number) {
        var project = issueProjects.readable(user, key);
        return richBodyFacade.editors(owner(project, issueOf(project, number)));
    }

    @Transactional
    public void editing(CurrentUser user, String key, long number, UUID lease) {
        var project = issueProjects.writable(user, key);
        richBodyFacade.editing(owner(project, issueOf(project, number)), user.id(), lease);
    }

    @Transactional
    public void stopEditing(CurrentUser user, String key, long number, UUID lease) {
        var project = issueProjects.readable(user, key);
        richBodyFacade.stopEditing(owner(project, issueOf(project, number)), user.id(), lease);
    }

    @Transactional(readOnly = true)
    public RichBodyState read(CurrentUser user, String key, long number) {
        var project = issueProjects.readable(user, key);
        return richBodyFacade.read(owner(project, issueOf(project, number)));
    }

    @Transactional(readOnly = true)
    public RichBodyState.BodyVersion version(CurrentUser user, String key, long number, UUID versionId) {
        var project = issueProjects.readable(user, key);
        return richBodyFacade.version(owner(project, issueOf(project, number)), versionId);
    }

    @Transactional
    public RichBodyState save(CurrentUser user, String key, long number, IssueBodyRequests.Save request) {
        var project = issueProjects.writable(user, key);
        return richBodyFacade.save(owner(project, issueOf(project, number)), user.id(), request.edit());
    }

    @Transactional
    public RichBodyState patch(CurrentUser user, String key, long number, RichBodyPatch patch) {
        var project = issueProjects.writable(user, key);
        return richBodyFacade.patch(owner(project, issueOf(project, number)), user.id(), patch);
    }

    /**
     * Writes the whole body at once, as an agent does from Markdown: the body it replaces is
     * kept as a version first, and the new one too, so either can be restored from the versions.
     */
    @Transactional
    public RichBodyState replace(CurrentUser user, String key, long number, Map<String, Object> body) {
        return replace(user, key, number, body, List.of());
    }

    @Transactional
    public RichBodyState replace(
            CurrentUser user, String key, long number, Map<String, Object> body, List<String> dropBlocks) {
        var project = issueProjects.writable(user, key);
        return richBodyFacade.replace(owner(project, issueOf(project, number)), user.id(), body, dropBlocks);
    }

    /** The same, written by author: for importers, which keep by whom what they bring was written. */
    @Transactional
    public RichBodyState replace(UUID author, String key, long number, Map<String, Object> body) {
        var project = issueProjects.open(key);
        var owner = owner(project, issueOf(project, number));
        return richBodyFacade.replace(owner, author, body, List.of());
    }

    @Transactional
    public RichBodyState restore(
            CurrentUser user, String key, long number, UUID revisionId, IssueBodyRequests.Restore request) {
        var project = issueProjects.writable(user, key);
        return richBodyFacade.restore(
                owner(project, issueOf(project, number)), user.id(), revisionId, request.expectedVersion());
    }

    /** A short-lived address of one of the issue's files, for whoever reads the issue. */
    @Transactional(readOnly = true)
    public URI fileUrl(CurrentUser user, String key, long number, UUID fileId, boolean download) {
        var project = issueProjects.readable(user, key);
        var issue = issueOf(project, number);
        return fileFacade
                .openUrl(OWNER_TYPE, issue.id(), fileId, download)
                .orElseThrow(IssueErrorCode.ISSUE_FILE_NOT_FOUND::raise);
    }

    private Issue issueOf(ProjectSummary project, long number) {
        return issueRepository
                .findByProjectIdAndNumber(project.id(), number)
                .filter(issue -> !issue.isDeleted())
                .orElseThrow(IssueErrorCode.ISSUE_NOT_FOUND::raise);
    }

    private static RichBodyOwner owner(ProjectSummary project, Issue issue) {
        return new RichBodyOwner(
                OWNER_TYPE,
                issue.id(),
                "/api/v1/workspace/projects/" + project.key() + "/issues/" + issue.number() + "/files");
    }
}

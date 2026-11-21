package xyz.goraebap.productivity.document.application.chapter;

import java.net.URI;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.foundation.file.FileFacade;
import xyz.goraebap.productivity.activity.ActivityOwner;
import xyz.goraebap.productivity.document.application.DocumentErrorCode;
import xyz.goraebap.productivity.document.application.activity.BodyActivity;
import xyz.goraebap.productivity.document.application.activity.BodyActivityRequests;
import xyz.goraebap.productivity.document.application.activity.BodyActivityViews;
import xyz.goraebap.productivity.document.application.body.DocumentBodyRequests;
import xyz.goraebap.productivity.document.domain.chapter.ManualChapterRepository;
import xyz.goraebap.productivity.richbody.RichBodyFacade;
import xyz.goraebap.productivity.richbody.RichBodyOwner;
import xyz.goraebap.productivity.richbody.RichBodyPatch;
import xyz.goraebap.productivity.richbody.RichBodyState;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * A 매뉴얼 chapter's body in the shared body editor, as a document's: read where the manual is read, written and commented
 * where it is written. Each save and restore keeps the body's plain text on the chapter, for search. Its files are the
 * chapter's (MANUAL_CHAPTER) and open through it.
 */
@Service
@RequiredArgsConstructor
public class ChapterBodyService {
    /** The file owner type of a chapter's body files, and the owner type of its body. */
    public static final String TYPE = "MANUAL_CHAPTER";

    private final ChapterService chapterService;
    private final ManualChapterRepository manualChapterRepository;
    private final RichBodyFacade richBodyFacade;
    private final BodyActivity bodyActivity;
    private final FileFacade fileFacade;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<RichBodyFacade.Editor> editors(CurrentUser user, UUID id) {
        return richBodyFacade.editors(owner(chapterService.readable(user, id).id()));
    }

    @Transactional
    public void editing(CurrentUser user, UUID id, UUID lease) {
        richBodyFacade.editing(owner(chapterService.writable(user, id).id()), user.id(), lease);
    }

    @Transactional
    public void stopEditing(CurrentUser user, UUID id, UUID lease) {
        richBodyFacade.stopEditing(owner(chapterService.readable(user, id).id()), user.id(), lease);
    }

    @Transactional(readOnly = true)
    public RichBodyState read(CurrentUser user, UUID id) {
        return richBodyFacade.read(owner(chapterService.readable(user, id).id()));
    }

    @Transactional(readOnly = true)
    public RichBodyState.BodyVersion version(CurrentUser user, UUID id, UUID versionId) {
        return richBodyFacade.version(owner(chapterService.readable(user, id).id()), versionId);
    }

    @Transactional
    public RichBodyState save(CurrentUser user, UUID id, DocumentBodyRequests.Save request) {
        var state = richBodyFacade.save(owner(chapterService.writable(user, id).id()), user.id(), request.edit());
        written(id, state, user);
        return state;
    }

    @Transactional
    public RichBodyState patch(CurrentUser user, UUID id, RichBodyPatch patch) {
        var state = richBodyFacade.patch(owner(chapterService.writable(user, id).id()), user.id(), patch);
        written(id, state, user);
        return state;
    }

    @Transactional
    public RichBodyState restore(CurrentUser user, UUID id, UUID revisionId, DocumentBodyRequests.Restore request) {
        var state = richBodyFacade.restore(
                owner(chapterService.writable(user, id).id()), user.id(), revisionId, request.expectedVersion());
        written(id, state, user);
        return state;
    }

    /** The chapter's timeline, for whoever reads the manual. */
    @Transactional(readOnly = true)
    public List<BodyActivityViews.Entry> timeline(CurrentUser user, UUID id) {
        return bodyActivity.timeline(
                activityOwner(chapterService.readable(user, id).id()));
    }

    /** A comment on the chapter's timeline, by whoever may write the manual; its id. */
    @Transactional
    public UUID addComment(CurrentUser user, UUID id, BodyActivityRequests.CommentInput request) {
        return bodyActivity.comment(
                activityOwner(chapterService.writable(user, id).id()), user, request);
    }

    @Transactional
    public void editComment(CurrentUser user, UUID id, UUID commentId, BodyActivityRequests.CommentEdit request) {
        bodyActivity.edit(activityOwner(chapterService.writable(user, id).id()), user, commentId, request);
    }

    @Transactional
    public void deleteComment(CurrentUser user, UUID id, UUID commentId) {
        bodyActivity.delete(
                activityOwner(chapterService.writable(user, id).id()), user, commentId, user.workspaceAdmin());
    }

    @Transactional
    public void resolveComment(CurrentUser user, UUID id, UUID commentId, BodyActivityRequests.Resolution request) {
        bodyActivity.resolve(activityOwner(chapterService.writable(user, id).id()), user, commentId, request);
    }

    private static ActivityOwner activityOwner(UUID chapterId) {
        return new ActivityOwner(TYPE, chapterId);
    }

    /** A short-lived address of one of the chapter's files, for whoever reads the manual. */
    @Transactional(readOnly = true)
    public URI fileUrl(CurrentUser user, UUID id, UUID fileId, boolean download) {
        return fileFacade
                .openUrl(TYPE, chapterService.readable(user, id).id(), fileId, download)
                .orElseThrow(DocumentErrorCode.DOCUMENT_FILE_NOT_FOUND::raise);
    }

    static RichBodyOwner owner(UUID chapterId) {
        return new RichBodyOwner(TYPE, chapterId, "/api/v1/workspace/manual-chapters/" + chapterId + "/files");
    }

    private void written(UUID id, RichBodyState state, CurrentUser user) {
        Map<String, Object> body = state.body() == null ? Map.of() : state.body();
        manualChapterRepository.updateBody(id, richBodyFacade.plainText(body), user.id(), clock.instant());
    }
}

package xyz.goraebap.workspace.document.application.body;

import java.net.URI;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.foundation.file.FileFacade;
import xyz.goraebap.workspace.activity.ActivityOwner;
import xyz.goraebap.workspace.document.application.DocumentErrorCode;
import xyz.goraebap.workspace.document.application.DocumentSpaces;
import xyz.goraebap.workspace.document.application.access.DocumentAccess;
import xyz.goraebap.workspace.document.application.activity.BodyActivity;
import xyz.goraebap.workspace.document.application.activity.BodyActivityRequests;
import xyz.goraebap.workspace.document.application.activity.BodyActivityViews;
import xyz.goraebap.workspace.document.domain.access.Grant;
import xyz.goraebap.workspace.document.domain.document.Document;
import xyz.goraebap.workspace.document.domain.document.DocumentRepository;
import xyz.goraebap.workspace.richbody.RichBodyFacade;
import xyz.goraebap.workspace.richbody.RichBodyPatch;
import xyz.goraebap.workspace.richbody.RichBodyState;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/**
 * A document's body in the shared body editor (RichBody), as an issue's: every member reads it with its versions and
 * comment threads, any member writes and comments in it where they may write. Each save and restore also keeps the
 * body's plain text on the document, for search and the lists' excerpt, and marks the document written then. The files
 * it shows are the document's (PROJECT_DOCUMENT) and open through it, so whoever reads the document sees them.
 */
@Service
@RequiredArgsConstructor
public class DocumentBodyService {
    private final RichBodyFacade richBodyFacade;
    private final BodyActivity bodyActivity;
    private final DocumentRepository documentRepository;
    private final DocumentSpaces documentSpaces;
    private final DocumentAccess documentAccess;
    private final FileFacade fileFacade;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<RichBodyFacade.Editor> editors(CurrentUser user, UUID id) {
        return richBodyFacade.editors(DocumentBodyOwner.of(readable(user, id).id()));
    }

    @Transactional
    public void editing(CurrentUser user, UUID id, UUID lease) {
        richBodyFacade.editing(DocumentBodyOwner.of(writable(user, id).id()), user.id(), lease);
    }

    @Transactional
    public void stopEditing(CurrentUser user, UUID id, UUID lease) {
        richBodyFacade.stopEditing(DocumentBodyOwner.of(readable(user, id).id()), user.id(), lease);
    }

    @Transactional(readOnly = true)
    public RichBodyState read(CurrentUser user, UUID id) {
        return richBodyFacade.read(DocumentBodyOwner.of(readable(user, id).id()));
    }

    @Transactional(readOnly = true)
    public RichBodyState.BodyVersion version(CurrentUser user, UUID id, UUID versionId) {
        return richBodyFacade.version(DocumentBodyOwner.of(readable(user, id).id()), versionId);
    }

    @Transactional
    public RichBodyState save(CurrentUser user, UUID id, DocumentBodyRequests.Save request) {
        var state = richBodyFacade.save(DocumentBodyOwner.of(writable(user, id).id()), user.id(), request.edit());
        written(id, state, user);
        return state;
    }

    @Transactional
    public RichBodyState patch(CurrentUser user, UUID id, RichBodyPatch patch) {
        var state = richBodyFacade.patch(DocumentBodyOwner.of(writable(user, id).id()), user.id(), patch);
        written(id, state, user);
        return state;
    }

    /**
     * Writes the whole body at once, as an agent does from Markdown: the body it replaces is
     * kept as a version first, and the new one too, so either can be restored from the versions.
     */
    @Transactional
    public RichBodyState replace(CurrentUser user, UUID id, Map<String, Object> body) {
        return replace(user, id, body, List.of());
    }

    @Transactional
    public RichBodyState replace(CurrentUser user, UUID id, Map<String, Object> body, List<String> dropBlocks) {
        var owner = DocumentBodyOwner.of(writable(user, id).id());
        var state = richBodyFacade.replace(owner, user.id(), body, dropBlocks);
        written(id, state, user);
        return state;
    }

    /** Replaces a run of the body's top-level blocks (an agent's one section), over the version read for that run only. */
    @Transactional
    public RichBodyState replaceBlocks(
            CurrentUser user,
            UUID id,
            List<String> range,
            String after,
            Map<String, Object> replacement,
            List<String> dropBlocks,
            Long expectedVersion) {
        var owner = DocumentBodyOwner.of(writable(user, id).id());
        var state =
                richBodyFacade.replaceBlocks(owner, user.id(), range, after, replacement, dropBlocks, expectedVersion);
        written(id, state, user);
        return state;
    }

    @Transactional
    public RichBodyState restore(CurrentUser user, UUID id, UUID revisionId, DocumentBodyRequests.Restore request) {
        var state = richBodyFacade.restore(
                DocumentBodyOwner.of(writable(user, id).id()), user.id(), revisionId, request.expectedVersion());
        written(id, state, user);
        return state;
    }

    /** The document's timeline, for whoever reads it. */
    @Transactional(readOnly = true)
    public List<BodyActivityViews.Entry> timeline(CurrentUser user, UUID id) {
        return bodyActivity.timeline(activityOwner(readable(user, id).id()));
    }

    /** A comment on the document's timeline, by whoever reads it in a project that is not archived (viewers too); its id. */
    @Transactional
    public UUID addComment(CurrentUser user, UUID id, BodyActivityRequests.CommentInput request) {
        return bodyActivity.comment(activityOwner(commentable(user, id).id()), user, request);
    }

    @Transactional
    public void editComment(CurrentUser user, UUID id, UUID commentId, BodyActivityRequests.CommentEdit request) {
        bodyActivity.edit(activityOwner(commentable(user, id).id()), user, commentId, request);
    }

    @Transactional
    public void deleteComment(CurrentUser user, UUID id, UUID commentId) {
        var document = commentable(user, id);
        bodyActivity.delete(
                activityOwner(document.id()), user, commentId, documentSpaces.administers(user, document.projectId()));
    }

    @Transactional
    public void resolveComment(CurrentUser user, UUID id, UUID commentId, BodyActivityRequests.Resolution request) {
        bodyActivity.resolve(activityOwner(commentable(user, id).id()), user, commentId, request);
    }

    /** A short-lived address of one of the document's files, for whoever reads the document. */
    @Transactional(readOnly = true)
    public URI fileUrl(CurrentUser user, UUID id, UUID fileId, boolean download) {
        return fileFacade
                .openUrl(DocumentBodyOwner.TYPE, readable(user, id).id(), fileId, download)
                .orElseThrow(DocumentErrorCode.DOCUMENT_FILE_NOT_FOUND::raise);
    }

    private static ActivityOwner activityOwner(UUID documentId) {
        return new ActivityOwner(DocumentBodyOwner.TYPE, documentId);
    }

    private Document readable(CurrentUser user, UUID id) {
        var document = live(id);
        documentSpaces.readableOf(user, document.projectId(), DocumentErrorCode.DOCUMENT_NOT_FOUND);
        documentAccess.requireDocument(user, document, Grant.Level.READ);
        return document;
    }

    private Document commentable(CurrentUser user, UUID id) {
        var document = live(id);
        documentSpaces.commentableOf(user, document.projectId(), DocumentErrorCode.DOCUMENT_NOT_FOUND);
        documentAccess.requireDocument(user, document, Grant.Level.READ);
        return document;
    }

    private Document writable(CurrentUser user, UUID id) {
        var document = live(id);
        documentSpaces.writableOf(user, document.projectId(), DocumentErrorCode.DOCUMENT_NOT_FOUND);
        documentAccess.requireDocument(user, document, Grant.Level.WRITE);
        return document;
    }

    private Document live(UUID id) {
        return documentRepository
                .findById(id)
                .filter(document -> !document.isDeleted() && document.isWritten())
                .orElseThrow(DocumentErrorCode.DOCUMENT_NOT_FOUND::raise);
    }

    /** The document written by the member now, its body's text kept. Lists hear of it with the next change. */
    private void written(UUID id, RichBodyState state, CurrentUser user) {
        Map<String, Object> body = state.body() == null ? Map.of() : state.body();
        documentRepository.updateBody(id, richBodyFacade.plainText(body), user.id(), clock.instant());
    }
}

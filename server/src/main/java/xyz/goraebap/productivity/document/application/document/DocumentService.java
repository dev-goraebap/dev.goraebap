package xyz.goraebap.productivity.document.application.document;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.foundation.user.UserFacade;
import xyz.goraebap.foundation.user.UserSummary;
import xyz.goraebap.productivity.document.application.DocumentErrorCode;
import xyz.goraebap.productivity.document.application.DocumentSpaces;
import xyz.goraebap.productivity.document.application.access.DocumentAccess;
import xyz.goraebap.productivity.document.application.body.DocumentBodyOwner;
import xyz.goraebap.productivity.document.domain.Mark;
import xyz.goraebap.productivity.document.domain.access.Grant;
import xyz.goraebap.productivity.document.domain.document.Document;
import xyz.goraebap.productivity.document.domain.document.DocumentRepository;
import xyz.goraebap.productivity.document.domain.folder.DocumentFolder;
import xyz.goraebap.productivity.document.domain.folder.DocumentFolderRepository;
import xyz.goraebap.productivity.richbody.RichBodyEdit;
import xyz.goraebap.productivity.richbody.RichBodyFacade;
import xyz.goraebap.shared.web.CurrentUser;
import xyz.goraebap.shared.web.SortDirection;

/**
 * Making and changing documents (BIT's 문서): any member writes in the shared space and in a project that is not
 * archived. A document may start with a body written elsewhere, as the editor's JSON or as Markdown, which imports and
 * agents use; a screen starts it empty. The title and the place change over the version read; a document moves only
 * among the folders of its own space. Its maker or a Workspace administrator deletes it. Each change tells every screen.
 */
@Service
@RequiredArgsConstructor
public class DocumentService {
    private static final int DEPTH_MAX = 100;
    private final DocumentQuery documentQuery;
    private final UserFacade userFacade;
    private final DocumentRepository documentRepository;
    private final DocumentFolderRepository documentFolderRepository;
    private final DocumentSpaces documentSpaces;
    private final DocumentAccess documentAccess;
    private final xyz.goraebap.productivity.document.domain.library.LibraryRepository libraryRepository;
    private final RichBodyFacade richBodyFacade;
    private final Clock clock;

    /** A new document by the member, now, in a folder they may write in; its id comes back. */
    @Transactional
    public UUID create(CurrentUser user, DocumentRequests.CreateDocument request) {
        requireShape(request);
        documentSpaces.writable(user, request.projectKey());
        if (request.folderId() != null) requireWritableFolder(user, request.folderId());
        if (request.parentId() != null) {
            var parent = documentRepository
                    .findById(request.parentId())
                    .filter(d -> !d.isDeleted())
                    .orElseThrow(DocumentErrorCode.DOCUMENT_NOT_FOUND::raise);
            documentAccess.requireDocument(user, parent, Grant.Level.WRITE);
        }
        return create(user.id(), clock.instant(), request);
    }

    /**
     * A new document written by author at the given moment, for the screens (now) and for importers, which keep when
     * and by whom what they bring was written: made then, with its first body (JSON or Markdown) as its first version.
     * Its id comes back.
     */
    @Transactional
    public UUID create(UUID author, Instant at, DocumentRequests.CreateDocument request) {
        requireShape(request);
        var space = documentSpaces.open(request.projectKey());
        if (request.parentId() != null) {
            var parent = documentRepository
                    .findById(request.parentId())
                    .filter(d -> !d.isDeleted() && space.projectId().equals(d.projectId()))
                    .orElseThrow(DocumentErrorCode.DOCUMENT_NOT_FOUND::raise);
            if (!request.labelIds().isEmpty())
                throw new xyz.goraebap.shared.error.DomainRuleViolation("하위 페이지는 별도 라벨을 갖지 않습니다");
            if (parent.parentId() != null) {
                var chain = new java.util.HashSet<UUID>();
                chain.add(parent.id());
                var atParent = parent;
                while (atParent.parentId() != null) {
                    if (!chain.add(atParent.parentId()) || chain.size() >= DEPTH_MAX)
                        throw new xyz.goraebap.shared.error.DomainRuleViolation("페이지 깊이가 너무 큽니다");
                    atParent = documentRepository
                            .findById(atParent.parentId())
                            .filter(d -> !d.isDeleted())
                            .orElseThrow(DocumentErrorCode.DOCUMENT_NOT_FOUND::raise);
                }
            }
        }
        var availableLabels = libraryRepository.labels().stream()
                .map(xyz.goraebap.productivity.document.domain.library.LibraryState.Label::id)
                .collect(Collectors.toSet());
        if (!availableLabels.containsAll(request.labelIds())
                || new java.util.HashSet<>(request.labelIds()).size()
                        != request.labelIds().size())
            throw new xyz.goraebap.shared.error.DomainRuleViolation("이 프로젝트의 문서 라벨을 골라 주세요");
        if (request.folderId() != null) requireFolder(space.projectId(), request.folderId());
        var document = Document.create(
                UUID.randomUUID(),
                space.projectId(),
                request.folderId(),
                request.kind(),
                request.title(),
                Mark.of(request.icon(), request.color()),
                author);
        document.reparent(request.parentId());
        documentRepository.save(document, author, at);
        libraryRepository.assign(document.id(), request.labelIds());
        Map<String, Object> body =
                request.markdown() != null ? richBodyFacade.fromMarkdown(request.markdown()) : request.body();
        if (body != null) {
            var saved = request.markdown() != null
                    ? richBodyFacade.replace(DocumentBodyOwner.of(document.id()), author, body, List.of())
                    : richBodyFacade.save(
                            DocumentBodyOwner.of(document.id()),
                            author,
                            new RichBodyEdit(0, body, request.uploadIds(), false));
            documentRepository.updateBody(document.id(), richBodyFacade.plainText(saved.body()), author, at);
        }
        documentSpaces.signal(document.id());
        return document.id();
    }

    @Transactional
    public void rename(CurrentUser user, UUID id, DocumentRequests.RenameDocument request) {
        var document = writable(user, id, request.expectedVersion());
        document.rename(request.title());
        save(document, user.id());
    }

    /** Gives the document another mark, or none. */
    @Transactional
    public void mark(CurrentUser user, UUID id, DocumentRequests.MarkDocument request) {
        var document = writable(user, id, request.expectedVersion());
        document.markAs(Mark.of(request.icon(), request.color()));
        save(document, user.id());
    }

    /** Puts the document in another folder of its space, or at its top. */
    @Transactional
    public void move(CurrentUser user, UUID id, DocumentRequests.MoveDocument request) {
        throw new xyz.goraebap.shared.error.DomainRuleViolation("상위 페이지 변경은 페이지 이동을 사용해 주세요");
    }

    /** A new document is a page with one first body at most (JSON or Markdown), its uploads named by that body. */
    private static void requireShape(DocumentRequests.CreateDocument request) {
        if (request.kind() != Document.Kind.PAGE || request.folderId() != null)
            throw new xyz.goraebap.shared.error.DomainRuleViolation("프로젝트 문서만 만들 수 있습니다. 폴더 대신 문서 라벨을 사용해 주세요");
        if (request.body() != null && request.markdown() != null) throw DocumentErrorCode.DOCUMENT_BODY_INVALID.raise();
        if (request.body() == null
                && request.markdown() == null
                && !request.uploadIds().isEmpty()) throw DocumentErrorCode.DOCUMENT_BODY_INVALID.raise();
    }

    /** Deletes the document, kept out of every list; its maker, one who manages it or the project's administrators may. */
    @Transactional
    public void delete(CurrentUser user, UUID id, long expectedVersion) {
        for (var target : deletionTargets(user, id, expectedVersion)) {
            target.delete(clock.instant());
            save(target, user.id());
        }
    }

    @Transactional(readOnly = true)
    public List<DocumentViews.DeletionTarget> previewDelete(CurrentUser user, UUID id, long expectedVersion) {
        return deletionTargets(user, id, expectedVersion).stream()
                .map(target -> new DocumentViews.DeletionTarget(target.id(), target.title(), target.version()))
                .toList();
    }

    private List<Document> deletionTargets(CurrentUser user, UUID id, long expectedVersion) {
        var document = writable(user, id, expectedVersion);
        if (!document.isMadeBy(user.id())
                && !documentAccess.levels(documentAccess.reader(user)).managesDocument(document))
            throw new AccessDeniedException("문서를 만든 사람, 관리 권한이 있는 사람이나 프로젝트 관리자만 지울 수 있습니다");
        var descendants = documentRepository.findAllIncludingDeleted().stream()
                .filter(d -> document.projectId().equals(d.projectId()) && !d.isDeleted())
                .toList();
        var ids = new java.util.HashSet<UUID>();
        ids.add(id);
        boolean changed;
        do {
            changed = false;
            for (var child : descendants)
                if (child.parentId() != null && ids.contains(child.parentId())) changed |= ids.add(child.id());
        } while (changed);
        var levels = documentAccess.levels(documentAccess.reader(user));
        for (var child : descendants)
            if (ids.contains(child.id())) {
                if (!levels.document(child).allows(Grant.Level.WRITE))
                    throw new AccessDeniedException("하위 페이지의 쓰기 권한이 필요합니다");
                if (!child.isMadeBy(user.id()) && !levels.managesDocument(child))
                    throw new AccessDeniedException("하위 페이지의 삭제 권한이 필요합니다");
            }
        return descendants.stream().filter(child -> ids.contains(child.id())).toList();
    }

    private Document writable(CurrentUser user, UUID id, long expectedVersion) {
        var document = documentRepository
                .findById(id)
                .filter(found -> !found.isDeleted())
                .orElseThrow(DocumentErrorCode.DOCUMENT_NOT_FOUND::raise);
        documentSpaces.writableOf(user, document.projectId(), DocumentErrorCode.DOCUMENT_NOT_FOUND);
        documentAccess.requireDocument(user, document, Grant.Level.WRITE);
        if (document.version() != expectedVersion) throw DocumentErrorCode.DOCUMENT_VERSION_CONFLICT.raise();
        return document;
    }

    /** The member must be able to write in the folder. */
    private void requireWritableFolder(CurrentUser user, UUID folderId) {
        documentAccess.requireFolder(user, folderId, Grant.Level.WRITE);
    }

    private void save(Document document, UUID actor) {
        if (!documentRepository.save(document, actor, clock.instant()))
            throw DocumentErrorCode.DOCUMENT_VERSION_CONFLICT.raise();
        documentSpaces.signal(document.id());
    }

    /** The folder must be a live one of the document's space. */
    private void requireFolder(UUID projectId, UUID folderId) {
        documentFolderRepository
                .findById(folderId)
                .filter(folder -> !folder.isDeleted() && Objects.equals(folder.projectId(), projectId))
                .orElseThrow(DocumentErrorCode.DOCUMENT_FOLDER_NOT_FOUND::raise);
    }
    /**
     * Documents matching the search the member may see, by default the latest written first (by title, 가나다 first).
     */
    @Transactional(readOnly = true)
    public DocumentViews.DocumentSlice list(CurrentUser user, DocumentRequests.Listing listing) {
        var hidden = documentAccess.hidden(documentAccess.reader(user));
        var space = listing.project() == null ? null : documentSpaces.readable(user, listing.project());
        var sort = listing.sort() == null ? DocumentRequests.Sort.UPDATED : listing.sort();
        var direction = Objects.requireNonNullElse(
                listing.direction(), sort == DocumentRequests.Sort.TITLE ? SortDirection.ASC : SortDirection.DESC);
        var filter = new DocumentQuery.Filter(
                space == null ? null : space.projectId(),
                space == null && listing.shared(),
                listing.folderId(),
                listing.top(),
                listing.q(),
                sort,
                direction,
                hidden.folderIds(),
                hidden.documentIds());
        var slice = documentQuery.findAll(filter, listing.cursor(), listing.size());
        return new DocumentViews.DocumentSlice(named(slice.rows()), slice.nextCursor());
    }

    @Transactional(readOnly = true)
    public DocumentQuery.ChangeSlice changes(
            CurrentUser user, String project, boolean shared, Instant since, Instant until, String cursor, int size) {
        var hidden = documentAccess.hidden(documentAccess.reader(user));
        var space = project == null ? null : documentSpaces.readable(user, project);
        var filter = new DocumentQuery.Filter(
                space == null ? null : space.projectId(),
                shared,
                null,
                false,
                null,
                DocumentRequests.Sort.UPDATED,
                SortDirection.DESC,
                hidden.folderIds(),
                hidden.documentIds());
        return documentQuery.changes(filter, since, until, cursor, size);
    }

    /**
     * One document with the folders down to it, and what the member may do with it: write it (its space is not archived
     * and its grants allow), delete it (they may write it and made it, manage it or administer Projects) and change its
     * grants. One they may not see is not found.
     */
    @Transactional(readOnly = true)
    public DocumentViews.DocumentView get(CurrentUser user, UUID id) {
        var row = documentQuery.findRow(id).orElseThrow(DocumentErrorCode.DOCUMENT_NOT_FOUND::raise);
        var space = documentSpaces.readableOf(user, row.projectId(), DocumentErrorCode.DOCUMENT_NOT_FOUND);
        var document = documentRepository.findById(id).orElseThrow(DocumentErrorCode.DOCUMENT_NOT_FOUND::raise);
        var levels = documentAccess.levels(documentAccess.reader(user));
        var level = levels.document(document);
        if (!level.allows(Grant.Level.READ)) throw DocumentErrorCode.DOCUMENT_NOT_FOUND.raise();
        boolean canWrite = !space.archived() && level.allows(Grant.Level.WRITE);
        boolean canManage = levels.managesDocument(document);
        return new DocumentViews.DocumentView(
                named(List.of(row)).getFirst(),
                path(row.projectId(), row.folderId()),
                canWrite,
                canWrite && (user.id().equals(row.createdById()) || canManage),
                canManage);
    }

    /** The folders from the space's top down to the given one. */
    private List<DocumentViews.FolderStep> path(UUID projectId, UUID folderId) {
        if (folderId == null) return List.of();
        Map<UUID, DocumentFolder> byId = documentFolderRepository.findAllByProjectId(projectId).stream()
                .collect(Collectors.toMap(DocumentFolder::id, Function.identity()));
        var path = new ArrayList<DocumentViews.FolderStep>();
        UUID at = folderId;
        while (at != null && byId.containsKey(at) && path.size() < DEPTH_MAX) {
            var folder = byId.get(at);
            path.add(new DocumentViews.FolderStep(folder.id(), folder.name()));
            at = folder.parentId();
        }
        Collections.reverse(path);
        return path;
    }

    /** The rows with their makers' and last writers' names, read in one batch. */
    private List<DocumentViews.DocumentRow> named(List<DocumentViews.DocumentRow> rows) {
        var ids = rows.stream()
                .flatMap(row -> Stream.of(row.createdById(), row.updatedById()))
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (ids.isEmpty()) return rows;
        var names = userFacade.summariesOf(ids);
        return rows.stream()
                .map(row -> row.named(nameOf(names, row.createdById()), nameOf(names, row.updatedById())))
                .toList();
    }

    private static String nameOf(Map<UUID, UserSummary> names, UUID id) {
        if (id == null) return null;
        var found = names.get(id);
        return found == null ? null : found.name();
    }
}

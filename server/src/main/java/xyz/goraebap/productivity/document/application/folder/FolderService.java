package xyz.goraebap.productivity.document.application.folder;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.productivity.document.application.DocumentErrorCode;
import xyz.goraebap.productivity.document.application.DocumentSpaces;
import xyz.goraebap.productivity.document.application.access.DocumentAccess;
import xyz.goraebap.productivity.document.domain.Mark;
import xyz.goraebap.productivity.document.domain.access.Grant;
import xyz.goraebap.productivity.document.domain.folder.DocumentFolder;
import xyz.goraebap.productivity.document.domain.folder.DocumentFolderRepository;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * The folders of a document space (BIT's 문서함 folders): every member reads a space's tree, any member makes, renames
 * and moves folders where they may write (the shared space, a project that is not archived), within the folder's own
 * space and never into itself or a folder it holds. Names are unique among neighbours whatever their case. A folder is
 * deleted once empty, by its maker or a Workspace administrator. Each change tells every screen.
 */
@Service
@RequiredArgsConstructor
public class FolderService {
    private final DocumentFolderRepository documentFolderRepository;
    private final FolderQuery folderQuery;
    private final DocumentSpaces documentSpaces;
    private final DocumentAccess documentAccess;
    private final Clock clock;

    /** Every live folder of a space (a project's key, or none for the shared space), by name. */
    @Transactional(readOnly = true)
    public List<FolderViews.FolderRow> list(CurrentUser user, String key) {
        var rows = folderQuery.findAll(documentSpaces.readable(user, key).projectId());
        var hidden = documentAccess.hidden(documentAccess.reader(user)).folderIds();
        return hidden.isEmpty()
                ? rows
                : rows.stream().filter(row -> !hidden.contains(row.id())).toList();
    }

    /** A new folder by the member, now, under a folder they may write in; its id comes back. */
    @Transactional
    public UUID create(CurrentUser user, FolderRequests.CreateFolder request) {
        documentSpaces.writable(user, request.projectKey());
        if (request.parentId() != null) documentAccess.requireFolder(user, request.parentId(), Grant.Level.WRITE);
        return create(user.id(), clock.instant(), request);
    }

    /**
     * A new folder made by actor at the given moment, for the screens (now) and for importers, which keep when and by
     * whom what they bring was made. Its id comes back.
     */
    @Transactional
    public UUID create(UUID actor, Instant at, FolderRequests.CreateFolder request) {
        var space = documentSpaces.open(request.projectKey());
        var folders = documentFolderRepository.findAllByProjectId(space.projectId());
        if (request.parentId() != null) requireIn(folders, request.parentId());
        requireFreeName(folders, request.parentId(), request.name(), null);
        var folder = DocumentFolder.create(
                UUID.randomUUID(),
                space.projectId(),
                request.parentId(),
                request.name(),
                Mark.of(request.icon(), request.color()),
                actor);
        documentFolderRepository.save(folder, actor, at);
        documentSpaces.signal(folder.id());
        return folder.id();
    }

    /**
     * The folder a slash-separated path of names finds in a space ("설계/화면"), its missing folders made by actor at the
     * given moment; an empty path is the space's top (null). For importers and agents, who name folders by path.
     */
    @Transactional
    public UUID resolve(UUID actor, Instant at, String key, String path) {
        var space = documentSpaces.open(key);
        if (path == null || path.isBlank()) return null;
        var folders = new ArrayList<>(documentFolderRepository.findAllByProjectId(space.projectId()));
        UUID parentId = null;
        for (String part : path.split("/")) {
            if (part.isBlank()) continue;
            String name = DocumentFolder.nameOf(part);
            UUID under = parentId;
            var found = folders.stream()
                    .filter(folder -> folder.isIn(under) && folder.isNamed(name))
                    .findFirst();
            if (found.isPresent()) {
                parentId = found.get().id();
                continue;
            }
            var folder = DocumentFolder.create(UUID.randomUUID(), space.projectId(), under, name, Mark.NONE, actor);
            documentFolderRepository.save(folder, actor, at);
            documentSpaces.signal(folder.id());
            folders.add(folder);
            parentId = folder.id();
        }
        return parentId;
    }

    @Transactional
    public void rename(CurrentUser user, UUID id, FolderRequests.RenameFolder request) {
        var folder = writable(user, id, request.expectedVersion());
        requireFreeName(
                documentFolderRepository.findAllByProjectId(folder.projectId()),
                folder.parentId(),
                request.name(),
                folder.id());
        folder.rename(request.name());
        save(folder, user.id());
    }

    /** Gives the folder another mark, or none. */
    @Transactional
    public void mark(CurrentUser user, UUID id, FolderRequests.MarkFolder request) {
        var folder = writable(user, id, request.expectedVersion());
        folder.markAs(Mark.of(request.icon(), request.color()));
        save(folder, user.id());
    }

    /** Puts a folder under another of its space, or at its top; never into itself or a folder it holds. */
    @Transactional
    public void move(CurrentUser user, UUID id, FolderRequests.MoveFolder request) {
        var folder = writable(user, id, request.expectedVersion());
        if (Objects.equals(folder.parentId(), request.parentId())) return;
        var folders = documentFolderRepository.findAllByProjectId(folder.projectId());
        if (request.parentId() != null) {
            requireIn(folders, request.parentId());
            documentAccess.requireFolder(user, request.parentId(), Grant.Level.WRITE);
            Map<UUID, DocumentFolder> byId =
                    folders.stream().collect(Collectors.toMap(DocumentFolder::id, Function.identity()));
            for (UUID at = request.parentId(); at != null; at = byId.get(at).parentId())
                if (at.equals(folder.id()) || !byId.containsKey(at))
                    throw DocumentErrorCode.DOCUMENT_FOLDER_MOVE_INVALID.raise();
        }
        requireFreeName(folders, request.parentId(), folder.name(), folder.id());
        folder.moveTo(request.parentId());
        save(folder, user.id());
    }

    /** Deletes an empty folder; its maker, one who manages it or a Workspace administrator may. */
    @Transactional
    public void delete(CurrentUser user, UUID id, long expectedVersion) {
        var folder = writable(user, id, expectedVersion);
        if (!user.id().equals(folder.createdBy())
                && !documentAccess.levels(documentAccess.reader(user)).managesFolder(folder))
            throw new AccessDeniedException("폴더를 만든 사람, 관리 권한이 있는 사람이나 프로젝트 관리자만 지울 수 있습니다");
        if (documentFolderRepository.existsContentById(folder.id()))
            throw DocumentErrorCode.DOCUMENT_FOLDER_NOT_EMPTY.raise();
        folder.delete(clock.instant());
        save(folder, user.id());
    }

    /** A live folder to change, in a space the member may write in, at the version they read. */
    private DocumentFolder writable(CurrentUser user, UUID id, long expectedVersion) {
        var folder = documentFolderRepository
                .findById(id)
                .filter(found -> !found.isDeleted())
                .orElseThrow(DocumentErrorCode.DOCUMENT_FOLDER_NOT_FOUND::raise);
        documentSpaces.writableOf(user, folder.projectId(), DocumentErrorCode.DOCUMENT_FOLDER_NOT_FOUND);
        documentAccess.requireFolder(user, folder.id(), Grant.Level.WRITE);
        if (folder.version() != expectedVersion) throw DocumentErrorCode.DOCUMENT_FOLDER_VERSION_CONFLICT.raise();
        return folder;
    }

    private void save(DocumentFolder folder, UUID actor) {
        if (!documentFolderRepository.save(folder, actor, clock.instant()))
            throw DocumentErrorCode.DOCUMENT_FOLDER_VERSION_CONFLICT.raise();
        documentSpaces.signal(folder.id());
    }

    /** The folder must be a live one of the space whose folders are given. */
    private static void requireIn(List<DocumentFolder> folders, UUID folderId) {
        if (folders.stream().noneMatch(folder -> folder.id().equals(folderId)))
            throw DocumentErrorCode.DOCUMENT_FOLDER_NOT_FOUND.raise();
    }

    private static void requireFreeName(List<DocumentFolder> folders, UUID parentId, String name, UUID except) {
        String wanted = DocumentFolder.nameOf(name);
        if (folders.stream()
                .anyMatch(folder -> folder.isIn(parentId) && !folder.id().equals(except) && folder.isNamed(wanted)))
            throw DocumentErrorCode.DOCUMENT_FOLDER_NAME_CONFLICT.raise();
    }
}

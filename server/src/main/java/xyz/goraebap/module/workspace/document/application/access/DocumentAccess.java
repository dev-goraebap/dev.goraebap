package xyz.goraebap.module.workspace.document.application.access;

import xyz.goraebap.module.workspace.project.WorkspaceRoles;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import xyz.goraebap.module.workspace.document.application.DocumentErrorCode;
import xyz.goraebap.module.workspace.document.domain.access.Grant;
import xyz.goraebap.module.workspace.document.domain.access.Grant.Level;
import xyz.goraebap.module.workspace.document.domain.access.GrantRepository;
import xyz.goraebap.module.workspace.document.domain.document.Document;
import xyz.goraebap.module.workspace.document.domain.document.DocumentRepository;
import xyz.goraebap.module.workspace.document.domain.folder.DocumentFolder;
import xyz.goraebap.module.workspace.document.domain.folder.DocumentFolderRepository;
import xyz.goraebap.module.workspace.project.ProjectAccess;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * What a member may do with 문서함's folders and documents, past the project's door: their
 * role in the project is the ceiling (a viewer reads, an editor writes, the project's administrator manages; who is not
 * a member nothing), and an archived project's are read only (checked by DocumentSpaces). Under it, a folder or document
 * with grants is closed to all but them, up to their level; what one may do is the narrowest along the way down. A
 * Workspace administrator, and the project's administrator in it, may do everything. One manages (changes the grants
 * of) an item they may read, in a project where they write, when they made it or a grant on it or above it gives them MANAGE.
 */
@Component
@RequiredArgsConstructor
public class DocumentAccess {
    private final GrantRepository grantRepository;
    private final DocumentFolderRepository documentFolderRepository;
    private final DocumentRepository documentRepository;
    private final ReaderQuery readerQuery;
    private final ProjectAccess projectAccess;

    /** The member as the grants see them. */
    public Reader reader(CurrentUser user) {
        if (WorkspaceRoles.admin(user)) return new Reader(user.id(), true, Set.of(), Map.of());
        return new Reader(user.id(), false, readerQuery.departmentsOf(user.id()), projectAccess.rolesOf(user.id()));
    }

    /** Every folder's and closed document's level for the reader, read once for one request. */
    public Levels levels(Reader reader) {
        var folderGrants = grantRepository.findAllByTarget(GrantRepository.Target.FOLDER);
        var documentGrants = grantRepository.findAllByTarget(GrantRepository.Target.DOCUMENT);
        Map<UUID, DocumentFolder> folders = folderGrants.isEmpty()
                ? Map.of()
                : documentFolderRepository.findAllIncludingDeleted().stream()
                        .collect(Collectors.toMap(DocumentFolder::id, Function.identity()));
        var pages = documentRepository.findAllIncludingDeleted().stream()
                .collect(Collectors.toMap(Document::id, Function.identity()));
        return new Levels(reader, folders, folderGrants, documentGrants, pages);
    }

    /**
     * The member must be able to go as far as wanted with the document: one they may not see is not found, one they may
     * see but not change is refused.
     */
    public void requireDocument(CurrentUser user, Document document, Level wanted) {
        require(levels(reader(user)).document(document), wanted, DocumentErrorCode.DOCUMENT_NOT_FOUND);
    }

    /** The member must be able to go as far as wanted with the folder, as with a document. */
    public void requireFolder(CurrentUser user, UUID folderId, Level wanted) {
        require(levels(reader(user)).folder(folderId), wanted, DocumentErrorCode.DOCUMENT_FOLDER_NOT_FOUND);
    }

    private static void require(Level level, Level wanted, DocumentErrorCode notFound) {
        if (!level.allows(Level.READ)) throw notFound.raise();
        if (!level.allows(wanted)) throw new AccessDeniedException("권한이 없습니다");
    }

    /** The ids of what the reader may not see: closed folders (and so all they hold) and closed documents. */
    public Hidden hidden(Reader reader) {
        if (reader.admin()) return Hidden.NONE;
        var levels = levels(reader);
        Set<UUID> folders = levels.folders.keySet().stream()
                .filter(id -> levels.folder(id) == Level.NONE)
                .collect(Collectors.toSet());
        Set<UUID> documents = new HashSet<>();
        // Every document is weighed: past the grants, a document of a project the reader is not in is hidden too.
        if (!levels.pages.isEmpty())
            levels.pages.values().stream()
                    .filter(document -> levels.document(document) == Level.NONE)
                    .forEach(document -> documents.add(document.id()));
        return new Hidden(folders, documents);
    }

    /** What a list leaves out for a reader. */
    public record Hidden(Set<UUID> folderIds, Set<UUID> documentIds) {
        public static final Hidden NONE = new Hidden(Set.of(), Set.of());

        public Hidden {
            folderIds = Set.copyOf(folderIds);
            documentIds = Set.copyOf(documentIds);
        }

        public boolean isEmpty() {
            return folderIds.isEmpty() && documentIds.isEmpty();
        }
    }

    /** The levels of folders and documents for one reader, each folder's worked out once from the top down. */
    public static final class Levels {
        private final Reader reader;
        private final Map<UUID, DocumentFolder> folders;
        private final Map<UUID, List<Grant>> folderGrants;
        private final Map<UUID, List<Grant>> documentGrants;
        private final Map<UUID, Document> pages;
        private final Map<UUID, Level> pageLevels = new HashMap<>();
        private final Map<UUID, Level> folderLevels = new HashMap<>();
        private final Map<UUID, Boolean> folderManaged = new HashMap<>();

        Levels(
                Reader reader,
                Map<UUID, DocumentFolder> folders,
                Map<UUID, List<Grant>> folderGrants,
                Map<UUID, List<Grant>> documentGrants,
                Map<UUID, Document> pages) {
            this.reader = reader;
            this.folders = folders;
            this.folderGrants = folderGrants;
            this.documentGrants = documentGrants;
            this.pages = pages;
        }

        /** The reader's level in a folder (none, a space's top: everyone writes there). */
        public Level folder(UUID folderId) {
            if (reader.admin()) return Level.MANAGE;
            if (folderId == null || !folders.containsKey(folderId)) return Level.WRITE;
            var known = folderLevels.get(folderId);
            if (known != null) return known;
            // Marked first, so a loop in the tree reads as closed rather than going round.
            folderLevels.put(folderId, Level.NONE);
            var folder = folders.get(folderId);
            var level = reader.administers(folder.projectId())
                    ? Level.MANAGE
                    : Level.min(
                            reader.ceiling(folder.projectId()),
                            Level.min(folder(folder.parentId()), cap(folderGrants.get(folderId), folder.createdBy())));
            folderLevels.put(folderId, level);
            return level;
        }

        /** The reader's level in a document: its folder's, narrowed by its own grants. */
        public Level document(Document document) {
            var known = pageLevels.get(document.id());
            if (known != null) return known;
            pageLevels.put(document.id(), Level.NONE);
            var parent = document.parentId() == null ? null : pages.get(document.parentId());
            var inherited = document.parentId() == null
                    ? Level.MANAGE
                    : parent == null || parent.isDeleted() ? Level.NONE : document(parent);
            var own = reader.administers(document.projectId())
                    ? Level.MANAGE
                    : Level.min(
                            reader.ceiling(document.projectId()),
                            Level.min(
                                    folder(document.folderId()),
                                    cap(documentGrants.get(document.id()), document.createdBy())));
            var result = Level.min(inherited, own);
            pageLevels.put(document.id(), result);
            return result;
        }

        /** Whether the reader may change the folder's grants. */
        public boolean managesFolder(DocumentFolder folder) {
            if (reader.administers(folder.projectId())) return true;
            return folder(folder.id()).allows(Level.READ)
                    && reader.ceiling(folder.projectId()).allows(Level.WRITE)
                    && (reader.userId().equals(folder.createdBy()) || managedByGrant(folder.id()));
        }

        /** Whether the reader may change the document's grants. */
        public boolean managesDocument(Document document) {
            if (reader.administers(document.projectId())) return true;
            return document(document).allows(Level.READ)
                    && reader.ceiling(document.projectId()).allows(Level.WRITE)
                    && (document.isMadeBy(reader.userId())
                            || managedByGrant(document.folderId())
                            || gives(documentGrants.get(document.id()), document.createdBy(), Level.MANAGE));
        }

        /** Whether a grant on the folder or one above it gives the reader MANAGE. */
        private boolean managedByGrant(UUID folderId) {
            if (folderId == null || !folders.containsKey(folderId)) return false;
            var known = folderManaged.get(folderId);
            if (known != null) return known;
            folderManaged.put(folderId, false);
            var folder = folders.get(folderId);
            boolean managed = gives(folderGrants.get(folderId), folder.createdBy(), Level.MANAGE)
                    || managedByGrant(folder.parentId());
            folderManaged.put(folderId, managed);
            return managed;
        }

        /** How far an item's grants let the reader go: no grants, no limit; else the highest of theirs, or none. */
        private Level cap(List<Grant> grants, UUID maker) {
            if (grants == null || grants.isEmpty()) return Level.MANAGE;
            return grants.stream()
                    .filter(grant -> reader.isFor(grant, maker))
                    .map(Grant::level)
                    .reduce(Level.NONE, Level::max);
        }

        private boolean gives(List<Grant> grants, UUID maker, Level level) {
            return grants != null
                    && grants.stream()
                            .anyMatch(grant ->
                                    reader.isFor(grant, maker) && grant.level().allows(level));
        }
    }
}

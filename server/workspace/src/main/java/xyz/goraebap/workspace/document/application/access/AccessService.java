package xyz.goraebap.workspace.document.application.access;

import java.time.Clock;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.foundation.user.UserFacade;
import xyz.goraebap.workspace.document.application.DocumentErrorCode;
import xyz.goraebap.workspace.document.application.DocumentSpaces;
import xyz.goraebap.workspace.document.domain.access.Grant;
import xyz.goraebap.workspace.document.domain.access.GrantRepository;
import xyz.goraebap.workspace.document.domain.access.GrantRepository.Target;
import xyz.goraebap.workspace.document.domain.document.DocumentRepository;
import xyz.goraebap.workspace.document.domain.folder.DocumentFolder;
import xyz.goraebap.workspace.document.domain.folder.DocumentFolderRepository;
import xyz.goraebap.workspace.project.ProjectFacade;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/**
 * The permission panel of a folder or document (docs/pending-records.md, 문서함 ②): whoever may see the item reads its
 * grants and the closed folders above it; whoever manages it puts new grants in place, never ones that would take their
 * own managing away (a Workspace administrator always manages). Each change tells every screen.
 */
@Service
@RequiredArgsConstructor
public class AccessService {
    /** How far up the folders go before a loop is assumed. */
    private static final int DEPTH_MAX = 100;

    private final GrantRepository grantRepository;
    private final DocumentRepository documentRepository;
    private final DocumentFolderRepository documentFolderRepository;
    private final DocumentAccess documentAccess;
    private final DocumentSpaces documentSpaces;
    private final ReaderQuery readerQuery;
    private final UserFacade userFacade;
    private final ProjectFacade projectFacade;
    private final Clock clock;

    @Transactional(readOnly = true)
    public AccessViews.AccessView document(CurrentUser user, UUID id) {
        return view(user, Target.DOCUMENT, id);
    }

    @Transactional(readOnly = true)
    public AccessViews.AccessView folder(CurrentUser user, UUID id) {
        return view(user, Target.FOLDER, id);
    }

    @Transactional
    public void replaceDocument(CurrentUser user, UUID id, AccessViews.ReplaceGrants request) {
        replace(user, Target.DOCUMENT, id, request);
    }

    @Transactional
    public void replaceFolder(CurrentUser user, UUID id, AccessViews.ReplaceGrants request) {
        replace(user, Target.FOLDER, id, request);
    }

    private AccessViews.AccessView view(CurrentUser user, Target target, UUID id) {
        var item = item(target, id);
        var levels = documentAccess.levels(documentAccess.reader(user));
        var level = item.level(levels);
        if (!level.allows(Grant.Level.READ)) throw item.notFound().raise();
        var inherited = new ArrayList<AccessViews.Inherited>();
        var folders = documentFolderRepository.findAllByProjectId(item.projectId()).stream()
                .collect(Collectors.toMap(DocumentFolder::id, Function.identity()));
        Set<UUID> seen = new HashSet<>();
        for (UUID at = item.above();
                at != null && folders.containsKey(at) && seen.add(at) && seen.size() < DEPTH_MAX;
                at = folders.get(at).parentId()) {
            var folder = folders.get(at);
            var grants = grantRepository.findByTarget(Target.FOLDER, at);
            if (!grants.isEmpty())
                inherited.add(new AccessViews.Inherited(at, folder.name(), named(grants, folder.createdBy())));
        }
        Collections.reverse(inherited);
        return new AccessViews.AccessView(
                named(grantRepository.findByTarget(target, id), item.maker()), inherited, level, item.manages(levels));
    }

    /** The item's grants in place of what it had; none opens it. */
    private void replace(CurrentUser user, Target target, UUID id, AccessViews.ReplaceGrants request) {
        var item = item(target, id);
        documentSpaces.writableOf(user, item.projectId(), item.notFound());
        var reader = documentAccess.reader(user);
        var before = documentAccess.levels(reader);
        if (!item.level(before).allows(Grant.Level.READ)) throw item.notFound().raise();
        if (!item.manages(before)) throw new AccessDeniedException("권한을 바꿀 수 있는 사람이 아닙니다");
        var grants = request.grants().stream()
                .map(input -> new Grant(input.subject(), input.subjectId(), input.level()))
                .distinct()
                .toList();
        requireSubjects(grants);
        grantRepository.replace(target, id, grants, user.id(), clock.instant());
        if (!item(target, id).manages(documentAccess.levels(reader)))
            throw DocumentErrorCode.DOCUMENT_ACCESS_LOCKOUT.raise();
        documentSpaces.signal(id);
    }

    /** Every member, department and project the grants name must exist. */
    private void requireSubjects(List<Grant> grants) {
        var users = ids(grants, Grant.Subject.USER);
        var departments = ids(grants, Grant.Subject.DEPARTMENT);
        var projects = ids(grants, Grant.Subject.PROJECT);
        boolean found = userFacade.summariesOf(users).keySet().containsAll(users)
                && readerQuery.departmentNames(departments).keySet().containsAll(departments)
                && projectFacade.summariesOf(projects).values().stream()
                        .filter(project -> !project.deleted())
                        .map(project -> project.id())
                        .collect(Collectors.toSet())
                        .containsAll(projects);
        if (!found) throw DocumentErrorCode.DOCUMENT_ACCESS_SUBJECT_NOT_FOUND.raise();
    }

    /** The grants with a name for each subject: the maker's own for OWNER. */
    private List<AccessViews.GrantView> named(List<Grant> grants, UUID maker) {
        var userIds = new HashSet<>(ids(grants, Grant.Subject.USER));
        if (maker != null) userIds.add(maker);
        var users = userFacade.summariesOf(userIds);
        var departments = readerQuery.departmentNames(ids(grants, Grant.Subject.DEPARTMENT));
        var projects = projectFacade.summariesOf(ids(grants, Grant.Subject.PROJECT));
        return grants.stream()
                .map(grant -> new AccessViews.GrantView(
                        grant.subject(),
                        grant.subjectId(),
                        switch (grant.subject()) {
                            case OWNER ->
                                maker == null || users.get(maker) == null
                                        ? null
                                        : users.get(maker).name();
                            case USER ->
                                users.get(grant.subjectId()) == null
                                        ? null
                                        : users.get(grant.subjectId()).name();
                            case DEPARTMENT -> departments.get(grant.subjectId());
                            case PROJECT ->
                                projects.get(grant.subjectId()) == null
                                        ? null
                                        : projects.get(grant.subjectId()).name();
                        },
                        grant.level()))
                .toList();
    }

    private static List<UUID> ids(List<Grant> grants, Grant.Subject subject) {
        return grants.stream()
                .filter(grant -> grant.subject() == subject)
                .map(Grant::subjectId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private Item item(Target target, UUID id) {
        return switch (target) {
            case FOLDER -> {
                var folder = documentFolderRepository
                        .findById(id)
                        .filter(found -> !found.isDeleted())
                        .orElseThrow(DocumentErrorCode.DOCUMENT_FOLDER_NOT_FOUND::raise);
                yield new Item(
                        folder.projectId(),
                        folder.parentId(),
                        folder.createdBy(),
                        DocumentErrorCode.DOCUMENT_FOLDER_NOT_FOUND,
                        levels -> levels.folder(folder.id()),
                        levels -> levels.managesFolder(folder));
            }
            case DOCUMENT -> {
                var document = documentRepository
                        .findById(id)
                        .filter(found -> !found.isDeleted() && found.isWritten())
                        .orElseThrow(DocumentErrorCode.DOCUMENT_NOT_FOUND::raise);
                yield new Item(
                        document.projectId(),
                        document.folderId(),
                        document.createdBy(),
                        DocumentErrorCode.DOCUMENT_NOT_FOUND,
                        levels -> levels.document(document),
                        levels -> levels.managesDocument(document));
            }
        };
    }

    /** A folder or document as the panel needs it: its space, the folder above it, its maker and its levels. */
    private record Item(
            UUID projectId,
            UUID above,
            UUID maker,
            DocumentErrorCode notFound,
            Function<DocumentAccess.Levels, Grant.Level> levelIn,
            Function<DocumentAccess.Levels, Boolean> managedIn) {
        Grant.Level level(DocumentAccess.Levels levels) {
            return levelIn.apply(levels);
        }

        boolean manages(DocumentAccess.Levels levels) {
            return managedIn.apply(levels);
        }
    }
}

package xyz.goraebap.module.workspace.document.application;

import java.util.List;
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
 * The project's door in front of its documents, as {@link ProjectAccess} judges it: a
 * project's viewers read its documents and comment, its editors also write them and its administrators also keep its
 * library (page moves, order, shared views). Who does not see the project does not find its documents (404); a role too
 * low is refused (403); an archived project's documents are read only (409) and a deleted one's are not found. Past the
 * door each document's own grants narrow what one may do ({@code DocumentAccess}). The shared space (공용, no project)
 * is kept for old documents only and is read by everyone. Each change tells every screen.
 */
@Component
@RequiredArgsConstructor
public class DocumentSpaces {
    private final ProjectFacade projectFacade;
    private final ProjectAccess projectAccess;
    private final RealtimeFacade realtimeFacade;

    /** The space a key names to read: a live project the user sees, its current key or an old one; no key is the shared space. */
    public Space readable(CurrentUser user, String key) {
        if (key == null || key.isBlank()) return Space.SHARED;
        var project = projectFacade
                .findByKey(key.strip())
                .filter(found -> !found.deleted())
                .orElseThrow(DocumentErrorCode.DOCUMENT_PROJECT_NOT_FOUND::raise);
        return seen(user, project, DocumentErrorCode.DOCUMENT_PROJECT_NOT_FOUND);
    }

    /** The space a key names to write in: a live, unarchived project where the user is an editor and up. */
    public Space writable(CurrentUser user, String key) {
        if (key == null || key.isBlank()) throw DocumentErrorCode.DOCUMENT_PROJECT_NOT_FOUND.raise();
        return least(user, unarchived(readable(user, key)), ProjectRole.EDITOR);
    }

    /** The space a key names for its administrators to keep its library: page moves, order and shared views. */
    public Space administered(CurrentUser user, String key) {
        if (key == null || key.isBlank()) throw DocumentErrorCode.DOCUMENT_PROJECT_NOT_FOUND.raise();
        return least(user, unarchived(readable(user, key)), ProjectRole.ADMIN);
    }

    /** The space a folder or document lives in (projectId null: the shared one), to read; a deleted project's is gone. */
    public Space readableOf(CurrentUser user, UUID projectId, DocumentErrorCode notFound) {
        if (projectId == null) return Space.SHARED;
        var project = projectFacade.summariesOf(List.of(projectId)).get(projectId);
        if (project == null || project.deleted()) throw notFound.raise();
        return seen(user, project, notFound);
    }

    /** The space a key names whoever asks, to write in: for importers, which bring their own people and need no rights. */
    public Space open(String key) {
        if (key == null || key.isBlank()) throw DocumentErrorCode.DOCUMENT_PROJECT_NOT_FOUND.raise();
        var project = projectFacade
                .findByKey(key.strip())
                .filter(found -> !found.deleted())
                .orElseThrow(DocumentErrorCode.DOCUMENT_PROJECT_NOT_FOUND::raise);
        return unarchived(Space.of(project));
    }

    /** The space of a folder or document, to comment on it: one the user sees, not archived. */
    public Space commentableOf(CurrentUser user, UUID projectId, DocumentErrorCode notFound) {
        if (projectId == null) throw notFound.raise();
        return unarchived(readableOf(user, projectId, notFound));
    }

    /** The space of a folder or document, to change it: an editor and up, not archived. */
    public Space writableOf(CurrentUser user, UUID projectId, DocumentErrorCode notFound) {
        if (projectId == null) throw notFound.raise();
        return least(user, unarchived(readableOf(user, projectId, notFound)), ProjectRole.EDITOR);
    }

    /** Whether the user administers the project (its administrators and Workspace administrators). */
    public boolean administers(CurrentUser user, UUID projectId) {
        return projectId != null && projectAccess.roleOf(projectId, user).atLeast(ProjectRole.ADMIN);
    }

    /** The projects whose documents the user sees. */
    public ProjectAccess.Visible visibleTo(CurrentUser user) {
        return projectAccess.visibleTo(user);
    }

    /** Tells every screen that a folder or document changed; id is what changed. */
    public void signal(UUID id) {
        realtimeFacade.signal(Signal.toEveryone(Signal.Topic.DOCUMENTS, id));
    }

    private Space seen(CurrentUser user, ProjectSummary project, DocumentErrorCode notFound) {
        if (!projectAccess.roleOf(project.id(), user).atLeast(ProjectRole.VIEWER)) throw notFound.raise();
        return Space.of(project);
    }

    private Space least(CurrentUser user, Space space, ProjectRole least) {
        if (!space.isShared() && !projectAccess.roleOf(space.projectId(), user).atLeast(least))
            throw new AccessDeniedException(least == ProjectRole.ADMIN ? "프로젝트 관리자만 할 수 있습니다" : "에디터 이상만 할 수 있습니다");
        return space;
    }

    private static Space unarchived(Space space) {
        if (space.archived()) throw DocumentErrorCode.DOCUMENT_PROJECT_ARCHIVED.raise();
        return space;
    }

    /**
     * A document space: a project (its id, current key and whether it is archived, so read only) or the shared one,
     * whose project id and key are null.
     */
    public record Space(UUID projectId, String projectKey, String projectName, boolean archived) {
        public static final Space SHARED = new Space(null, null, null, false);

        static Space of(ProjectSummary project) {
            return new Space(project.id(), project.key(), project.name(), project.archived());
        }

        public boolean isShared() {
            return projectId == null;
        }
    }
}

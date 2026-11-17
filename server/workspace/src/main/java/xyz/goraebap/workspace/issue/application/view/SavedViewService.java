package xyz.goraebap.workspace.issue.application.view;

import xyz.goraebap.workspace.project.WorkspaceRoles;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.foundation.realtime.RealtimeFacade;
import xyz.goraebap.foundation.realtime.Signal;
import xyz.goraebap.workspace.issue.application.IssueErrorCode;
import xyz.goraebap.workspace.issue.application.IssueProjects;
import xyz.goraebap.workspace.issue.domain.view.SavedView;
import xyz.goraebap.workspace.issue.domain.view.SavedViewRepository;
import xyz.goraebap.workspace.project.ProjectRole;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/**
 * The saved views over an issue list (BIT's views): the area's (no key) or a project's (its key, current or old). Every
 * member sees the scope's shared views and their own personal ones, and makes, changes and deletes personal ones;
 * Workspace administrators keep the shared views and their order, whose first is the scope's default view. A view of an
 * archived project still changes, as it changes no issue.
 */
@Service
@RequiredArgsConstructor
public class SavedViewService {
    private static final String NOT_ADMIN = "프로젝트 관리자만 모두의 뷰를 바꿀 수 있습니다";

    private final SavedViewRepository savedViewRepository;
    private final IssueProjects issueProjects;
    private final RealtimeFacade realtimeFacade;
    private final Clock clock;

    /**
     * The scope's views in the pills' order, the views listed in it too: the shared ones (전체 이슈 among them) as
     * ordered, then the reader's own.
     */
    @Transactional(readOnly = true)
    public SavedViewViews.ViewList list(CurrentUser user, String key) {
        UUID projectId = scope(user, key);
        var views = savedViewRepository.findAllVisible(projectId, user.id());
        var shared = new ArrayList<String>();
        shared.add(SavedView.ALL);
        views.stream()
                .filter(view -> !view.personal())
                .forEach(view -> shared.add(view.id().toString()));
        var order = new LinkedHashSet<String>();
        savedViewRepository.findOrder(projectId).stream()
                .filter(shared::contains)
                .forEach(order::add);
        order.addAll(shared);
        views.stream()
                .filter(SavedView::personal)
                .forEach(view -> order.add(view.id().toString()));
        var keys = List.copyOf(order);
        return new SavedViewViews.ViewList(
                keys,
                views.stream()
                        .sorted(Comparator.comparingInt(
                                view -> keys.indexOf(view.id().toString())))
                        .map(view -> row(view, user))
                        .toList(),
                keepsShared(user, projectId));
    }

    @Transactional
    public UUID create(CurrentUser user, String key, SavedViewRequests.ViewInput request) {
        UUID projectId = scope(user, key);
        if (!request.isPersonal() && !keepsShared(user, projectId)) throw new AccessDeniedException(NOT_ADMIN);
        var view = SavedView.create(
                UUID.randomUUID(), projectId, user.id(), request.isPersonal(), definition(projectId, request));
        savedViewRepository.save(view, user.id(), clock.instant());
        if (!view.personal()) signal(view);
        return view.id();
    }

    /** Changes a view over the version it was read at; making a personal view shared, or back, is its owner's. */
    @Transactional
    public void edit(CurrentUser user, UUID viewId, SavedViewRequests.EditView request) {
        var view = editable(user, viewId);
        if (view.version() != request.expectedVersion()) throw IssueErrorCode.ISSUE_VIEW_VERSION_CONFLICT.raise();
        var input = request.view();
        if (input.isPersonal() != view.personal() && (!view.ownedBy(user.id()) || !keepsShared(user, view.projectId())))
            throw new AccessDeniedException(NOT_ADMIN);
        boolean wasShared = !view.personal();
        long before = view.version();
        view.revise(definition(view.projectId(), input), input.isPersonal());
        if (view.version() == before) return;
        savedViewRepository.save(view, user.id(), clock.instant());
        if (wasShared || !view.personal()) signal(view);
    }

    @Transactional
    public void delete(CurrentUser user, UUID viewId, long expectedVersion) {
        var view = editable(user, viewId);
        if (view.version() != expectedVersion) throw IssueErrorCode.ISSUE_VIEW_VERSION_CONFLICT.raise();
        savedViewRepository.deleteById(view.id());
        if (!view.personal()) signal(view);
    }

    /**
     * Puts the scope's shared views in a new order, its first the default. The keys must be exactly 전체 이슈 and the
     * shared views as they are now, so an order made over an older list is refused rather than half applied.
     */
    @Transactional
    public void order(CurrentUser user, String key, SavedViewRequests.Order request) {
        UUID projectId = scope(user, key);
        if (!keepsShared(user, projectId)) throw new AccessDeniedException(NOT_ADMIN);
        var shared = new HashSet<String>();
        shared.add(SavedView.ALL);
        savedViewRepository.findAllVisible(projectId, user.id()).stream()
                .filter(view -> !view.personal())
                .forEach(view -> shared.add(view.id().toString()));
        var keys = request.keys();
        if (keys.size() != shared.size() || !shared.equals(new HashSet<>(keys)))
            throw IssueErrorCode.ISSUE_VIEW_ORDER_MISMATCH.raise();
        savedViewRepository.saveOrder(projectId, keys, user.id(), clock.instant());
        if (projectId == null) realtimeFacade.signal(Signal.toEveryone(Signal.Topic.ISSUES, user.id()));
        else issueProjects.signal(projectId);
    }

    /** The project a key names (live, archived or not) among those the user sees, or the area for no key. */
    private UUID scope(CurrentUser user, String key) {
        return key == null ? null : issueProjects.readable(user, key).id();
    }

    /**
     * Whether the user keeps the scope's shared views and their order: the project's administrators, or for the area
     * (every project) Workspace administrators.
     */
    private boolean keepsShared(CurrentUser user, UUID projectId) {
        if (projectId == null) return WorkspaceRoles.admin(user);
        return issueProjects.roleOf(user, projectId).atLeast(ProjectRole.ADMIN);
    }

    /** A view the user sees and may change: their own personal one, or a shared one for who keeps the shared ones. */
    private SavedView editable(CurrentUser user, UUID viewId) {
        var view = savedViewRepository
                .findById(viewId)
                .filter(found -> found.visibleTo(user.id()))
                .orElseThrow(IssueErrorCode.ISSUE_VIEW_NOT_FOUND::raise);
        if (view.projectId() != null
                && (!issueProjects.exists(view.projectId())
                        || !issueProjects.roleOf(user, view.projectId()).atLeast(ProjectRole.VIEWER)))
            throw IssueErrorCode.ISSUE_VIEW_NOT_FOUND.raise();
        if (!canEdit(view, user)) throw new AccessDeniedException(NOT_ADMIN);
        return view;
    }

    private boolean canEdit(SavedView view, CurrentUser user) {
        return view.personal() ? view.ownedBy(user.id()) : keepsShared(user, view.projectId());
    }

    private static SavedView.Definition definition(UUID projectId, SavedViewRequests.ViewInput input) {
        return SavedView.Definition.of(
                projectId != null,
                input.name(),
                input.icon(),
                input.color(),
                input.layout(),
                input.filters().toMap(),
                input.sort(),
                input.direction(),
                input.grouping());
    }

    /** Tells every screen that a shared view of the scope changed; a personal one is no one else's to hear of. */
    private void signal(SavedView view) {
        if (view.projectId() == null) realtimeFacade.signal(Signal.toEveryone(Signal.Topic.ISSUES, view.id()));
        else issueProjects.signal(view.projectId());
    }

    private SavedViewViews.ViewRow row(SavedView view, CurrentUser user) {
        var d = view.definition();
        return new SavedViewViews.ViewRow(
                view.id(),
                d.name(),
                d.icon(),
                d.color(),
                d.layout(),
                SavedViewViews.ViewFilters.of(d.filters()),
                d.sort(),
                d.direction(),
                d.grouping(),
                view.personal(),
                canEdit(view, user),
                view.version());
    }
}

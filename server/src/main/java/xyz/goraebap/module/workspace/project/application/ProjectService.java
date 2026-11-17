package xyz.goraebap.module.workspace.project.application;

import xyz.goraebap.module.workspace.project.WorkspaceRoles;
import java.time.Clock;
import java.time.Instant;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.module.foundation.realtime.RealtimeFacade;
import xyz.goraebap.module.foundation.realtime.Signal;
import xyz.goraebap.module.foundation.user.UserFacade;
import xyz.goraebap.module.workspace.project.NewProject;
import xyz.goraebap.module.workspace.project.ProjectAccess;
import xyz.goraebap.module.workspace.project.ProjectFacade;
import xyz.goraebap.module.workspace.project.ProjectRole;
import xyz.goraebap.module.workspace.project.ProjectSetupSpi;
import xyz.goraebap.module.workspace.project.ProjectSummary;
import xyz.goraebap.module.workspace.project.domain.Project;
import xyz.goraebap.module.workspace.project.domain.ProjectRepository;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * Projects as the workspace keeps them, seen by their members: a member is a viewer, an editor or an
 * administrator of a project, and who is not a member does not find it. A project's administrators change it and say
 * who belongs to it with which role (at least one administrator stays); Workspace administrators, the administrators of
 * every project, also make, order, archive, delete and restore them. Each change goes over the version the screen read
 * and tells every screen.
 */
@Service
@RequiredArgsConstructor
public class ProjectService implements ProjectFacade {
    private final ProjectRepository projectRepository;
    private final ProjectQuery projectQuery;
    private final ProjectAccess projectAccess;
    private final UserFacade userFacade;
    private final RealtimeFacade realtimeFacade;
    private final List<ProjectSetupSpi> projectSetupSpis;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<ProjectViews.ProjectView> list(CurrentUser user, ProjectRequests.Listing listing) {
        if (listing.status() == ProjectRequests.Status.DELETED) requireAdmin(user);
        return projectQuery.findAll(listing.status(), reader(user));
    }

    /**
     * The project a key names, its current key or an old one, for who sees it (its members and Workspace administrators);
     * a deleted project only for Workspace administrators. Who does not see it does not find it.
     */
    @Transactional(readOnly = true)
    public ProjectViews.ProjectView get(CurrentUser user, String key) {
        var view = projectQuery.findById(idOf(key), reader(user));
        if (!view.can().view()) throw ProjectErrorCode.PROJECT_NOT_FOUND.raise();
        if (view.deletedAt() != null && !WorkspaceRoles.admin(user)) throw ProjectErrorCode.PROJECT_NOT_FOUND.raise();
        return view;
    }

    @Transactional
    public String create(CurrentUser user, ProjectRequests.CreateProject request) {
        requireAdmin(user);
        return make(
                        user.id(),
                        clock.instant(),
                        new NewProject(
                                request.key(), request.name(), request.description(), request.icon(), request.color()))
                .key();
    }

    /** Changes the key, name, description and mark together; a new key keeps the old one as this project's. */
    @Transactional
    public void edit(CurrentUser user, String key, ProjectRequests.EditProject request) {
        var project = live(key, request.expectedVersion());
        requireManager(user, project.id());
        if (project.isArchived()) throw ProjectErrorCode.PROJECT_ARCHIVED.raise();
        project.revise(request.key(), request.name(), request.description(), request.icon(), request.color());
        requireFreeKey(project.key(), project.id());
        save(user, project);
    }

    @Transactional
    public void archive(CurrentUser user, String key, ProjectRequests.Versioned request) {
        requireAdmin(user);
        var project = live(key, request.expectedVersion());
        project.archive(clock.instant());
        save(user, project);
    }

    @Transactional
    public void unarchive(CurrentUser user, String key, ProjectRequests.Versioned request) {
        requireAdmin(user);
        var project = live(key, request.expectedVersion());
        project.unarchive();
        save(user, project);
    }

    /** Deletes the project: it leaves every list but stays for what names it, and can be restored. */
    @Transactional
    public void delete(CurrentUser user, String key, long expectedVersion) {
        requireAdmin(user);
        var project = live(key, expectedVersion);
        project.delete(clock.instant());
        save(user, project);
    }

    @Transactional
    public void restore(CurrentUser user, String key, ProjectRequests.Versioned request) {
        requireAdmin(user);
        var project = found(idOf(key), request.expectedVersion());
        project.restore();
        save(user, project);
    }

    /** Puts every live, unarchived project in the given order; the list must be exactly those projects. */
    @Transactional
    public void reorder(CurrentUser user, ProjectRequests.Order request) {
        requireAdmin(user);
        var active = projectRepository.findActiveIds();
        if (request.ids().size() != active.size() || !new HashSet<>(request.ids()).equals(new HashSet<>(active)))
            throw ProjectErrorCode.PROJECT_ORDER_MISMATCH.raise();
        projectRepository.updateOrder(request.ids());
        // The order is everyone's lists'.
        realtimeFacade.signal(Signal.toEveryone(
                Signal.Topic.PROJECTS,
                request.ids().isEmpty() ? user.id() : request.ids().getFirst()));
    }

    /** Who belongs to which live project with which role: every project for a Workspace administrator, else their own. */
    @Transactional(readOnly = true)
    public List<ProjectViews.Membership> memberships(CurrentUser user) {
        return projectQuery.findMemberships(reader(user));
    }

    @Transactional(readOnly = true)
    public List<ProjectViews.MemberView> members(CurrentUser user, String key) {
        var view = get(user, key);
        var joined = projectQuery.findMembers(view.id());
        var names = userFacade.summariesOf(
                joined.stream().map(ProjectQuery.Joined::userId).toList());
        return joined.stream()
                .filter(member -> names.containsKey(member.userId()))
                .map(member -> {
                    var person = names.get(member.userId());
                    return new ProjectViews.MemberView(
                            member.userId(), person.name(), person.affiliationName(), member.role(), member.at());
                })
                .toList();
    }

    /**
     * Adds someone who works here to the project with a role, also when it is archived; adding a member again changes
     * nothing (their role changes with {@link #changeMember}). The project's administrators say who belongs.
     */
    @Transactional
    public void addMember(CurrentUser user, String key, ProjectRequests.AddMember request) {
        var project = live(key, null);
        requireManager(user, project.id());
        requireMemberRole(request.role());
        if (!Boolean.FALSE.equals(userFacade.hasLeft(request.userId()).orElse(true)))
            throw ProjectErrorCode.PROJECT_USER_NOT_FOUND.raise();
        projectRepository.addMember(project.id(), request.userId(), request.role(), user.id(), clock.instant());
        signal(project.id());
    }

    /** Gives a member another role; the project keeps at least one administrator. */
    @Transactional
    public void changeMember(CurrentUser user, String key, UUID userId, ProjectRequests.ChangeMember request) {
        var project = live(key, null);
        requireManager(user, project.id());
        requireMemberRole(request.role());
        var role = projectQuery
                .findRole(project.id(), userId)
                .orElseThrow(ProjectErrorCode.PROJECT_MEMBER_NOT_FOUND::raise);
        if (role == ProjectRole.ADMIN && request.role() != ProjectRole.ADMIN) requireAnotherAdmin(project.id());
        projectRepository.changeRole(project.id(), userId, request.role());
        signal(project.id());
    }

    /** Takes a member out of the project, who then no longer sees it; the project keeps at least one administrator. */
    @Transactional
    public void removeMember(CurrentUser user, String key, UUID userId) {
        var project = live(key, null);
        requireManager(user, project.id());
        if (projectQuery.findRole(project.id(), userId).orElse(null) == ProjectRole.ADMIN)
            requireAnotherAdmin(project.id());
        projectRepository.removeMember(project.id(), userId);
        signal(project.id(), userId);
    }

    @Transactional(readOnly = true)
    public List<UUID> favorites(CurrentUser user) {
        return projectQuery.findFavorites(reader(user));
    }

    /** Marks a project the member sees as one of their own, listed under 프로젝트 in their menu, or not. */
    @Transactional
    public void favorite(CurrentUser user, String key, ProjectRequests.Favorite request) {
        var project = live(key, null);
        if (!projectAccess.roleOf(project.id(), user).atLeast(ProjectRole.VIEWER))
            throw ProjectErrorCode.PROJECT_NOT_FOUND.raise();
        projectRepository.setFavorite(user.id(), project.id(), request.favorite(), clock.instant());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, ProjectSummary> summariesOf(Collection<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        return projectRepository.findAllById(ids).stream()
                .map(ProjectService::summary)
                .collect(Collectors.toMap(ProjectSummary::id, Function.identity()));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ProjectSummary> findByKey(String key) {
        String normal;
        try {
            normal = Project.normalKey(key);
        } catch (RuntimeException invalid) {
            return Optional.empty();
        }
        return projectRepository
                .findIdByKey(normal)
                .flatMap(projectRepository::findById)
                .map(ProjectService::summary);
    }

    @Override
    @Transactional
    public long takeWorkItemNumber(UUID id) {
        return projectRepository.takeWorkItemNumber(id);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean exists(UUID id) {
        return projectRepository
                .findById(id)
                .filter(project -> !project.isDeleted())
                .isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> descriptionOf(UUID id) {
        return projectRepository.findById(id).map(Project::description).filter(text -> !text.isBlank());
    }

    @Override
    @Transactional
    public ProjectSummary findOrCreate(UUID actor, Instant at, NewProject project) {
        return findByKey(project.key()).orElseGet(() -> summary(make(actor, at, project)));
    }

    /** A new project made by actor at the given moment, with what every project starts with; the actor its administrator. */
    private Project make(UUID actor, Instant at, NewProject request) {
        var project = Project.create(
                UUID.randomUUID(),
                request.key(),
                request.name(),
                request.description(),
                request.icon(),
                request.color(),
                projectRepository.nextPosition());
        requireFreeKey(project.key(), project.id());
        projectRepository.save(project, actor, at);
        projectRepository.addMember(project.id(), actor, ProjectRole.ADMIN, actor, at);
        projectSetupSpis.forEach(setup -> setup.projectCreated(project.id(), actor));
        signal(project.id());
        return project;
    }

    private UUID idOf(String key) {
        String normal;
        try {
            normal = Project.normalKey(key);
        } catch (RuntimeException invalid) {
            throw ProjectErrorCode.PROJECT_NOT_FOUND.raise();
        }
        return projectRepository.findIdByKey(normal).orElseThrow(ProjectErrorCode.PROJECT_NOT_FOUND::raise);
    }

    /** The project a key names, not deleted, read at the given version (any version when null). */
    private Project live(String key, Long expectedVersion) {
        var project = found(idOf(key), expectedVersion);
        if (project.isDeleted()) throw ProjectErrorCode.PROJECT_NOT_FOUND.raise();
        return project;
    }

    private Project found(UUID id, Long expectedVersion) {
        var project = projectRepository.findById(id).orElseThrow(ProjectErrorCode.PROJECT_NOT_FOUND::raise);
        if (expectedVersion != null && project.version() != expectedVersion)
            throw ProjectErrorCode.PROJECT_VERSION_CONFLICT.raise();
        return project;
    }

    private void requireFreeKey(String key, UUID projectId) {
        projectRepository
                .findOwnerOfKey(key)
                .filter(owner -> !owner.equals(projectId))
                .ifPresent(owner -> {
                    throw ProjectErrorCode.PROJECT_KEY_CONFLICT.raise();
                });
    }

    private void save(CurrentUser user, Project project) {
        if (!projectRepository.save(project, user.id(), clock.instant()))
            throw ProjectErrorCode.PROJECT_VERSION_CONFLICT.raise();
        signal(project.id());
    }

    /** Tells who sees the project, and anyone else named (a member just taken out), that it or its members changed. */
    private void signal(UUID id, UUID... also) {
        var reached = new java.util.HashSet<>(projectAccess.viewersOf(id));
        reached.addAll(List.of(also));
        realtimeFacade.signal(Signal.to(Signal.Topic.PROJECTS, id, reached));
    }

    private static ProjectSummary summary(Project project) {
        return new ProjectSummary(
                project.id(),
                project.key(),
                project.name(),
                project.icon(),
                project.color(),
                project.isArchived(),
                project.isDeleted());
    }

    private static void requireAdmin(CurrentUser user) {
        if (!WorkspaceRoles.admin(user)) throw new AccessDeniedException("워크스페이스 관리자만 할 수 있습니다");
    }

    /** The project's administrators keep it; who does not see it does not find it, a viewer or an editor may not. */
    private void requireManager(CurrentUser user, UUID projectId) {
        var role = projectAccess.roleOf(projectId, user);
        if (!role.atLeast(ProjectRole.VIEWER)) throw ProjectErrorCode.PROJECT_NOT_FOUND.raise();
        if (!role.atLeast(ProjectRole.ADMIN)) throw new AccessDeniedException("프로젝트 관리자만 할 수 있습니다");
    }

    private void requireAnotherAdmin(UUID projectId) {
        long admins = projectQuery.findMembers(projectId).stream()
                .filter(member -> member.role() == ProjectRole.ADMIN)
                .count();
        if (admins <= 1) throw ProjectErrorCode.PROJECT_LAST_ADMIN.raise();
    }

    private static void requireMemberRole(ProjectRole role) {
        if (role == ProjectRole.NONE) throw ProjectErrorCode.PROJECT_ROLE_INVALID.raise();
    }

    private static ProjectQuery.Reader reader(CurrentUser user) {
        return new ProjectQuery.Reader(user.id(), WorkspaceRoles.admin(user));
    }
}

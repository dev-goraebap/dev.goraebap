package xyz.goraebap.workspace.project.application;

import xyz.goraebap.workspace.WorkspaceRoles;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.workspace.project.ProjectAccess;
import xyz.goraebap.workspace.project.ProjectRole;
import xyz.goraebap.foundation.shared.web.CurrentUser;

@Service
@RequiredArgsConstructor
class ProjectAccessService implements ProjectAccess {
    private final ProjectQuery projectQuery;

    @Override
    @Transactional(readOnly = true)
    public ProjectRole roleOf(UUID projectId, CurrentUser user) {
        if (WorkspaceRoles.admin(user)) return ProjectRole.ADMIN;
        return projectQuery.findRole(projectId, user.id()).orElse(ProjectRole.NONE);
    }

    @Override
    @Transactional(readOnly = true)
    public Visible visibleTo(CurrentUser user) {
        if (WorkspaceRoles.admin(user)) return Visible.ALL;
        return new Visible(false, projectQuery.findProjectsOf(user.id()));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, ProjectRole> rolesOf(UUID userId) {
        return projectQuery.findRolesOf(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Set<UUID> viewersOf(UUID projectId) {
        var viewers = new HashSet<>(projectQuery.findWorkspaceAdministrators());
        projectQuery.findMembers(projectId).forEach(member -> viewers.add(member.userId()));
        return viewers;
    }
}

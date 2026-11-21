package xyz.goraebap.productivity.project.infrastructure;

import static xyz.goraebap.jooq.tables.Project.PROJECT;
import static xyz.goraebap.jooq.tables.ProjectFavorite.PROJECT_FAVORITE;
import static xyz.goraebap.jooq.tables.ProjectKey.PROJECT_KEY;
import static xyz.goraebap.jooq.tables.ProjectMember.PROJECT_MEMBER;
import static xyz.goraebap.jooq.tables.UserRole.USER_ROLE;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.SelectOnConditionStep;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.productivity.project.ProjectRole;
import xyz.goraebap.productivity.project.application.ProjectErrorCode;
import xyz.goraebap.productivity.project.application.ProjectQuery;
import xyz.goraebap.productivity.project.application.ProjectRequests;
import xyz.goraebap.productivity.project.application.ProjectViews;
import xyz.goraebap.shared.web.Role;

@Repository
@RequiredArgsConstructor
class JooqProjectQuery implements ProjectQuery {
    private final DSLContext dslContext;

    @Override
    public List<ProjectViews.ProjectView> findAll(ProjectRequests.Status status, Reader reader) {
        Condition shown =
                switch (status) {
                    case ACTIVE -> PROJECT.DELETED_AT.isNull().and(PROJECT.ARCHIVED_AT.isNull());
                    case ARCHIVED -> PROJECT.DELETED_AT.isNull().and(PROJECT.ARCHIVED_AT.isNotNull());
                    case DELETED -> PROJECT.DELETED_AT.isNotNull();
                };
        var order = status == ProjectRequests.Status.ACTIVE
                ? List.of(PROJECT.POSITION.asc(), PROJECT.PROJECT_ID.asc())
                : List.of(PROJECT.NAME.asc(), PROJECT.PROJECT_ID.asc());
        return select(reader)
                .where(shown.and(seenBy(reader, PROJECT.PROJECT_ID)))
                .orderBy(order)
                .fetch(row -> view(row, reader));
    }

    @Override
    public ProjectViews.ProjectView findById(UUID id, Reader reader) {
        return select(reader)
                .where(PROJECT.PROJECT_ID.eq(id))
                .fetchOptional(row -> view(row, reader))
                .orElseThrow(ProjectErrorCode.PROJECT_NOT_FOUND::raise);
    }

    @Override
    public List<ProjectViews.Membership> findMemberships(Reader reader) {
        return dslContext
                .select(PROJECT_MEMBER.PROJECT_ID, PROJECT_MEMBER.USER_ID, PROJECT_MEMBER.ROLE)
                .from(PROJECT_MEMBER)
                .join(PROJECT)
                .on(PROJECT.PROJECT_ID.eq(PROJECT_MEMBER.PROJECT_ID))
                .where(PROJECT.DELETED_AT.isNull().and(seenBy(reader, PROJECT_MEMBER.PROJECT_ID)))
                .orderBy(PROJECT.POSITION, PROJECT_MEMBER.CREATED_AT)
                .fetch(row ->
                        new ProjectViews.Membership(row.value1(), row.value2(), ProjectRole.valueOf(row.value3())));
    }

    @Override
    public List<Joined> findMembers(UUID projectId) {
        return dslContext
                .select(PROJECT_MEMBER.USER_ID, PROJECT_MEMBER.ROLE, PROJECT_MEMBER.CREATED_AT)
                .from(PROJECT_MEMBER)
                .where(PROJECT_MEMBER.PROJECT_ID.eq(projectId))
                .orderBy(PROJECT_MEMBER.CREATED_AT, PROJECT_MEMBER.USER_ID)
                .fetch(row -> new Joined(row.value1(), ProjectRole.valueOf(row.value2()), row.value3()));
    }

    @Override
    public Optional<ProjectRole> findRole(UUID projectId, UUID userId) {
        return dslContext
                .select(PROJECT_MEMBER.ROLE)
                .from(PROJECT_MEMBER)
                .where(PROJECT_MEMBER.PROJECT_ID.eq(projectId).and(PROJECT_MEMBER.USER_ID.eq(userId)))
                .fetchOptional(PROJECT_MEMBER.ROLE)
                .map(ProjectRole::valueOf);
    }

    @Override
    public Set<UUID> findProjectsOf(UUID userId) {
        return new HashSet<>(dslContext
                .select(PROJECT_MEMBER.PROJECT_ID)
                .from(PROJECT_MEMBER)
                .where(PROJECT_MEMBER.USER_ID.eq(userId))
                .fetch(PROJECT_MEMBER.PROJECT_ID));
    }

    @Override
    public Set<UUID> findWorkspaceAdministrators() {
        return new HashSet<>(dslContext
                .select(USER_ROLE.USER_ID)
                .from(USER_ROLE)
                .where(USER_ROLE.ROLE.eq(Role.WORKSPACE_ADMIN.name()))
                .fetch(USER_ROLE.USER_ID));
    }

    @Override
    public Map<UUID, ProjectRole> findRolesOf(UUID userId) {
        var roles = new HashMap<UUID, ProjectRole>();
        dslContext
                .select(PROJECT_MEMBER.PROJECT_ID, PROJECT_MEMBER.ROLE)
                .from(PROJECT_MEMBER)
                .join(PROJECT)
                .on(PROJECT.PROJECT_ID.eq(PROJECT_MEMBER.PROJECT_ID))
                .where(PROJECT_MEMBER.USER_ID.eq(userId).and(PROJECT.DELETED_AT.isNull()))
                .fetch()
                .forEach(row -> roles.put(row.value1(), ProjectRole.valueOf(row.value2())));
        return roles;
    }

    @Override
    public List<UUID> findFavorites(Reader reader) {
        return dslContext
                .select(PROJECT_FAVORITE.PROJECT_ID)
                .from(PROJECT_FAVORITE)
                .join(PROJECT)
                .on(PROJECT.PROJECT_ID.eq(PROJECT_FAVORITE.PROJECT_ID))
                .where(PROJECT_FAVORITE
                        .USER_ID
                        .eq(reader.id())
                        .and(PROJECT_FAVORITE.IS_FAVORITE.isTrue())
                        .and(PROJECT.DELETED_AT.isNull())
                        .and(seenBy(reader, PROJECT.PROJECT_ID)))
                .orderBy(PROJECT.POSITION, PROJECT.PROJECT_ID)
                .fetch(PROJECT_FAVORITE.PROJECT_ID);
    }

    /** The projects the reader sees: all for a Workspace administrator, else those they are a member of. */
    private static Condition seenBy(Reader reader, Field<UUID> projectId) {
        if (reader.workspaceAdmin()) return DSL.trueCondition();
        return projectId.in(DSL.select(PROJECT_MEMBER.PROJECT_ID)
                .from(PROJECT_MEMBER)
                .where(PROJECT_MEMBER.USER_ID.eq(reader.id())));
    }

    private SelectOnConditionStep<Record> select(Reader reader) {
        var members = DSL.selectCount()
                .from(PROJECT_MEMBER)
                .where(PROJECT_MEMBER.PROJECT_ID.eq(PROJECT.PROJECT_ID))
                .asField("member_count");
        var role = DSL.field(DSL.select(PROJECT_MEMBER.ROLE)
                        .from(PROJECT_MEMBER)
                        .where(PROJECT_MEMBER
                                .PROJECT_ID
                                .eq(PROJECT.PROJECT_ID)
                                .and(PROJECT_MEMBER.USER_ID.eq(reader.id()))))
                .as("my_role");
        var favorite = DSL.exists(DSL.selectOne()
                        .from(PROJECT_FAVORITE)
                        .where(PROJECT_FAVORITE
                                .PROJECT_ID
                                .eq(PROJECT.PROJECT_ID)
                                .and(PROJECT_FAVORITE.USER_ID.eq(reader.id()))
                                .and(PROJECT_FAVORITE.IS_FAVORITE.isTrue())))
                .as("favorite");
        return dslContext
                .select(PROJECT.fields())
                .select(PROJECT_KEY.PREFIX, members, role, favorite)
                .from(PROJECT)
                .join(PROJECT_KEY)
                .on(PROJECT_KEY.PROJECT_ID.eq(PROJECT.PROJECT_ID).and(PROJECT_KEY.IS_CURRENT.isTrue()));
    }

    private static ProjectViews.ProjectView view(Record row, Reader reader) {
        var stored = row.get("my_role", String.class);
        var role = reader.workspaceAdmin()
                ? ProjectRole.ADMIN
                : stored == null ? ProjectRole.NONE : ProjectRole.valueOf(stored);
        var archivedAt = row.get(PROJECT.ARCHIVED_AT);
        var deletedAt = row.get(PROJECT.DELETED_AT);
        return new ProjectViews.ProjectView(
                row.get(PROJECT.PROJECT_ID),
                row.get(PROJECT_KEY.PREFIX),
                row.get(PROJECT.NAME),
                row.get(PROJECT.DESCRIPTION),
                row.get(PROJECT.ICON),
                row.get(PROJECT.COLOR),
                row.get(PROJECT.POSITION),
                archivedAt,
                deletedAt,
                row.get(PROJECT.VERSION),
                row.get("member_count", Integer.class),
                Boolean.TRUE.equals(row.get("favorite", Boolean.class)),
                role,
                ProjectViews.Can.of(role, archivedAt != null, deletedAt != null),
                row.get(PROJECT.CREATED_AT),
                row.get(PROJECT.UPDATED_AT));
    }
}

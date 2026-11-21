package xyz.goraebap.productivity.project.infrastructure;

import static xyz.goraebap.jooq.tables.Project.PROJECT;
import static xyz.goraebap.jooq.tables.ProjectFavorite.PROJECT_FAVORITE;
import static xyz.goraebap.jooq.tables.ProjectKey.PROJECT_KEY;
import static xyz.goraebap.jooq.tables.ProjectMember.PROJECT_MEMBER;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Query;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.productivity.project.ProjectRole;
import xyz.goraebap.productivity.project.domain.Project;
import xyz.goraebap.productivity.project.domain.ProjectRepository;

@Repository
@RequiredArgsConstructor
class JooqProjectRepository implements ProjectRepository {
    private final DSLContext dslContext;

    @Override
    public Optional<Project> findById(UUID id) {
        return findAllById(List.of(id)).stream().findFirst();
    }

    @Override
    public Optional<UUID> findIdByKey(String key) {
        return findOwnerOfKey(key);
    }

    @Override
    public Optional<UUID> findOwnerOfKey(String key) {
        return dslContext
                .select(PROJECT_KEY.PROJECT_ID)
                .from(PROJECT_KEY)
                .where(PROJECT_KEY.PREFIX.eq(key))
                .fetchOptional(PROJECT_KEY.PROJECT_ID);
    }

    @Override
    public List<Project> findAllById(Collection<UUID> ids) {
        if (ids.isEmpty()) return List.of();
        return dslContext
                .select(PROJECT.fields())
                .select(PROJECT_KEY.PREFIX)
                .from(PROJECT)
                .join(PROJECT_KEY)
                .on(PROJECT_KEY.PROJECT_ID.eq(PROJECT.PROJECT_ID).and(PROJECT_KEY.IS_CURRENT.isTrue()))
                .where(PROJECT.PROJECT_ID.in(ids))
                .fetch(JooqProjectRepository::project);
    }

    @Override
    public List<UUID> findActiveIds() {
        return dslContext
                .select(PROJECT.PROJECT_ID)
                .from(PROJECT)
                .where(PROJECT.DELETED_AT.isNull().and(PROJECT.ARCHIVED_AT.isNull()))
                .orderBy(PROJECT.POSITION, PROJECT.PROJECT_ID)
                .fetch(PROJECT.PROJECT_ID);
    }

    @Override
    public int nextPosition() {
        return dslContext
                .select(DSL.coalesce(DSL.max(PROJECT.POSITION).plus(1), 0))
                .from(PROJECT)
                .fetchOptional(0, Integer.class)
                .orElse(0);
    }

    @Override
    public long takeWorkItemNumber(UUID id) {
        dslContext
                .update(PROJECT)
                .set(PROJECT.LAST_WORK_ITEM_NUMBER, PROJECT.LAST_WORK_ITEM_NUMBER.plus(1))
                .where(PROJECT.PROJECT_ID.eq(id))
                .execute();
        return dslContext
                .select(PROJECT.LAST_WORK_ITEM_NUMBER)
                .from(PROJECT)
                .where(PROJECT.PROJECT_ID.eq(id))
                .fetchOptional(PROJECT.LAST_WORK_ITEM_NUMBER)
                .orElseThrow(() -> new IllegalStateException("번호를 줄 프로젝트가 없습니다"));
    }

    @Override
    public boolean save(Project project, UUID actor, Instant now) {
        int updated = dslContext
                .update(PROJECT)
                .set(PROJECT.NAME, project.name())
                .set(PROJECT.DESCRIPTION, project.description())
                .set(PROJECT.ICON, project.icon())
                .set(PROJECT.COLOR, project.color())
                .set(PROJECT.ARCHIVED_AT, project.archivedAt())
                .set(PROJECT.DELETED_AT, project.deletedAt())
                .set(PROJECT.DELETED_BY, project.isDeleted() ? actor : null)
                .set(PROJECT.VERSION, PROJECT.VERSION.plus(1))
                .set(PROJECT.UPDATED_AT, now)
                .set(PROJECT.UPDATED_BY, actor)
                .where(PROJECT.PROJECT_ID.eq(project.id()).and(PROJECT.VERSION.eq(project.version())))
                .execute();
        if (updated == 0) {
            if (dslContext.fetchExists(PROJECT, PROJECT.PROJECT_ID.eq(project.id()))) return false;
            dslContext
                    .insertInto(PROJECT)
                    .set(PROJECT.PROJECT_ID, project.id())
                    .set(PROJECT.NAME, project.name())
                    .set(PROJECT.DESCRIPTION, project.description())
                    .set(PROJECT.ICON, project.icon())
                    .set(PROJECT.COLOR, project.color())
                    .set(PROJECT.POSITION, project.position())
                    .set(PROJECT.VERSION, 0L)
                    .set(PROJECT.CREATED_AT, now)
                    .set(PROJECT.UPDATED_AT, now)
                    .set(PROJECT.CREATED_BY, actor)
                    .set(PROJECT.UPDATED_BY, actor)
                    .execute();
        }
        switchKey(project.id(), project.key(), now);
        return true;
    }

    /** Makes the key the project's current one; the key it had stays its own, no longer current. */
    private void switchKey(UUID projectId, String key, Instant now) {
        dslContext
                .update(PROJECT_KEY)
                .set(PROJECT_KEY.IS_CURRENT, false)
                .where(PROJECT_KEY.PROJECT_ID.eq(projectId).and(PROJECT_KEY.PREFIX.ne(key)))
                .execute();
        dslContext
                .insertInto(PROJECT_KEY)
                .set(PROJECT_KEY.PREFIX, key)
                .set(PROJECT_KEY.PROJECT_ID, projectId)
                .set(PROJECT_KEY.IS_CURRENT, true)
                .set(PROJECT_KEY.CREATED_AT, now)
                .onConflict(PROJECT_KEY.PREFIX)
                .doUpdate()
                .set(PROJECT_KEY.IS_CURRENT, true)
                .execute();
    }

    @Override
    public void updateOrder(List<UUID> orderedIds) {
        var updates = new ArrayList<Query>();
        for (int index = 0; index < orderedIds.size(); index++)
            updates.add(dslContext
                    .update(PROJECT)
                    .set(PROJECT.POSITION, index)
                    .where(PROJECT.PROJECT_ID.eq(orderedIds.get(index))));
        dslContext.batch(updates).execute();
    }

    @Override
    public void addMember(UUID projectId, UUID userId, ProjectRole role, UUID actor, Instant now) {
        dslContext
                .insertInto(PROJECT_MEMBER)
                .set(PROJECT_MEMBER.PROJECT_ID, projectId)
                .set(PROJECT_MEMBER.USER_ID, userId)
                .set(PROJECT_MEMBER.ROLE, role.name())
                .set(PROJECT_MEMBER.CREATED_AT, now)
                .set(PROJECT_MEMBER.CREATED_BY, actor)
                .onConflictDoNothing()
                .execute();
        dslContext
                .insertInto(PROJECT_FAVORITE)
                .set(PROJECT_FAVORITE.USER_ID, userId)
                .set(PROJECT_FAVORITE.PROJECT_ID, projectId)
                .set(PROJECT_FAVORITE.CREATED_AT, now)
                .set(PROJECT_FAVORITE.IS_FAVORITE, true)
                .onConflictDoNothing()
                .execute();
    }

    @Override
    public boolean changeRole(UUID projectId, UUID userId, ProjectRole role) {
        return dslContext
                        .update(PROJECT_MEMBER)
                        .set(PROJECT_MEMBER.ROLE, role.name())
                        .where(PROJECT_MEMBER.PROJECT_ID.eq(projectId).and(PROJECT_MEMBER.USER_ID.eq(userId)))
                        .execute()
                > 0;
    }

    @Override
    public void removeMember(UUID projectId, UUID userId) {
        dslContext
                .deleteFrom(PROJECT_MEMBER)
                .where(PROJECT_MEMBER.PROJECT_ID.eq(projectId).and(PROJECT_MEMBER.USER_ID.eq(userId)))
                .execute();
    }

    @Override
    public void setFavorite(UUID userId, UUID projectId, boolean favorite, Instant now) {
        dslContext
                .insertInto(PROJECT_FAVORITE)
                .set(PROJECT_FAVORITE.USER_ID, userId)
                .set(PROJECT_FAVORITE.PROJECT_ID, projectId)
                .set(PROJECT_FAVORITE.CREATED_AT, now)
                .set(PROJECT_FAVORITE.IS_FAVORITE, favorite)
                .onConflict(PROJECT_FAVORITE.USER_ID, PROJECT_FAVORITE.PROJECT_ID)
                .doUpdate()
                .set(PROJECT_FAVORITE.IS_FAVORITE, favorite)
                .execute();
    }

    private static Project project(Record row) {
        return Project.fromPersistence(
                row.get(PROJECT.PROJECT_ID),
                row.get(PROJECT_KEY.PREFIX),
                row.get(PROJECT.NAME),
                row.get(PROJECT.DESCRIPTION),
                row.get(PROJECT.ICON),
                row.get(PROJECT.COLOR),
                row.get(PROJECT.POSITION),
                row.get(PROJECT.ARCHIVED_AT),
                row.get(PROJECT.DELETED_AT),
                row.get(PROJECT.VERSION));
    }
}

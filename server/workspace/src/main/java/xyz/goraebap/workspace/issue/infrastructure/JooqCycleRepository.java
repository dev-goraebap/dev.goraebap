package xyz.goraebap.workspace.issue.infrastructure;

import org.springframework.beans.factory.annotation.Qualifier;
import xyz.goraebap.workspace.WorkspaceDatabaseConfig;
import static xyz.goraebap.workspace.jooq.tables.IssueCycle.ISSUE_CYCLE;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.workspace.jooq.tables.records.IssueCycleRecord;
import xyz.goraebap.workspace.issue.domain.cycle.Cycle;
import xyz.goraebap.workspace.issue.domain.cycle.CycleRepository;

@Repository
@RequiredArgsConstructor
class JooqCycleRepository implements CycleRepository {
    @Qualifier(WorkspaceDatabaseConfig.DSL)
    private final DSLContext dslContext;

    @Override
    public List<Cycle> findAllByProjectId(UUID projectId) {
        return dslContext
                .selectFrom(ISSUE_CYCLE)
                .where(ISSUE_CYCLE.PROJECT_ID.eq(projectId))
                .orderBy(ISSUE_CYCLE.START_DATE, ISSUE_CYCLE.CREATED_AT)
                .fetch(JooqCycleRepository::cycle);
    }

    @Override
    public Optional<Cycle> findById(UUID id) {
        return dslContext
                .selectFrom(ISSUE_CYCLE)
                .where(ISSUE_CYCLE.CYCLE_ID.eq(id))
                .fetchOptional(JooqCycleRepository::cycle);
    }

    @Override
    public boolean save(Cycle cycle, UUID actor, Instant now) {
        int updated = dslContext
                .update(ISSUE_CYCLE)
                .set(ISSUE_CYCLE.NAME, cycle.name())
                .set(ISSUE_CYCLE.GOAL, cycle.goal())
                .set(ISSUE_CYCLE.START_DATE, cycle.startDate())
                .set(ISSUE_CYCLE.END_DATE, cycle.endDate())
                .set(ISSUE_CYCLE.COMPLETED_AT, cycle.completedAt())
                .set(ISSUE_CYCLE.VERSION, ISSUE_CYCLE.VERSION.plus(1))
                .set(ISSUE_CYCLE.UPDATED_AT, now)
                .set(ISSUE_CYCLE.UPDATED_BY, actor)
                .where(ISSUE_CYCLE.CYCLE_ID.eq(cycle.id()).and(ISSUE_CYCLE.VERSION.eq(cycle.version())))
                .execute();
        if (updated > 0) return true;
        if (dslContext.fetchExists(ISSUE_CYCLE, ISSUE_CYCLE.CYCLE_ID.eq(cycle.id()))) return false;
        dslContext
                .insertInto(ISSUE_CYCLE)
                .set(ISSUE_CYCLE.CYCLE_ID, cycle.id())
                .set(ISSUE_CYCLE.PROJECT_ID, cycle.projectId())
                .set(ISSUE_CYCLE.NAME, cycle.name())
                .set(ISSUE_CYCLE.GOAL, cycle.goal())
                .set(ISSUE_CYCLE.START_DATE, cycle.startDate())
                .set(ISSUE_CYCLE.END_DATE, cycle.endDate())
                .set(ISSUE_CYCLE.COMPLETED_AT, cycle.completedAt())
                .set(ISSUE_CYCLE.VERSION, 0L)
                .set(ISSUE_CYCLE.CREATED_AT, now)
                .set(ISSUE_CYCLE.CREATED_BY, actor)
                .set(ISSUE_CYCLE.UPDATED_AT, now)
                .set(ISSUE_CYCLE.UPDATED_BY, actor)
                .execute();
        return true;
    }

    @Override
    public void delete(UUID id) {
        dslContext.deleteFrom(ISSUE_CYCLE).where(ISSUE_CYCLE.CYCLE_ID.eq(id)).execute();
    }

    private static Cycle cycle(IssueCycleRecord row) {
        return Cycle.fromPersistence(
                row.getCycleId(),
                row.getProjectId(),
                row.getName(),
                row.getGoal(),
                row.getStartDate(),
                row.getEndDate(),
                row.getCompletedAt(),
                row.getVersion());
    }
}

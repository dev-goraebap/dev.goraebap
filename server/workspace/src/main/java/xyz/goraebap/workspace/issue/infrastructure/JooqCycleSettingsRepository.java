package xyz.goraebap.workspace.issue.infrastructure;

import org.springframework.beans.factory.annotation.Qualifier;
import xyz.goraebap.workspace.WorkspaceDatabaseConfig;
import static xyz.goraebap.workspace.jooq.tables.IssueCycleSettings.ISSUE_CYCLE_SETTINGS;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.workspace.issue.domain.cycle.CycleSettings;
import xyz.goraebap.workspace.issue.domain.cycle.CycleSettingsRepository;

@Repository
@RequiredArgsConstructor
class JooqCycleSettingsRepository implements CycleSettingsRepository {
    @Qualifier(WorkspaceDatabaseConfig.DSL)
    private final DSLContext dslContext;

    @Override
    public Optional<CycleSettings> find(UUID projectId) {
        return dslContext
                .selectFrom(ISSUE_CYCLE_SETTINGS)
                .where(ISSUE_CYCLE_SETTINGS.PROJECT_ID.eq(projectId))
                .fetchOptional(row -> new CycleSettings(
                        row.getProjectId(),
                        Boolean.TRUE.equals(row.getIsEnabled()),
                        row.getWeeks(),
                        row.getStartDay(),
                        row.getUpcoming(),
                        Boolean.TRUE.equals(row.getAddsStarted()),
                        Boolean.TRUE.equals(row.getAddsCompleted())));
    }

    @Override
    public void save(CycleSettings settings, UUID actor, Instant now) {
        dslContext
                .insertInto(ISSUE_CYCLE_SETTINGS)
                .set(ISSUE_CYCLE_SETTINGS.PROJECT_ID, settings.projectId())
                .set(ISSUE_CYCLE_SETTINGS.IS_ENABLED, settings.isEnabled())
                .set(ISSUE_CYCLE_SETTINGS.WEEKS, settings.weeks())
                .set(ISSUE_CYCLE_SETTINGS.START_DAY, settings.startDay())
                .set(ISSUE_CYCLE_SETTINGS.UPCOMING, settings.upcoming())
                .set(ISSUE_CYCLE_SETTINGS.ADDS_STARTED, settings.addsStarted())
                .set(ISSUE_CYCLE_SETTINGS.ADDS_COMPLETED, settings.addsCompleted())
                .set(ISSUE_CYCLE_SETTINGS.UPDATED_AT, now)
                .set(ISSUE_CYCLE_SETTINGS.UPDATED_BY, actor)
                .onConflict(ISSUE_CYCLE_SETTINGS.PROJECT_ID)
                .doUpdate()
                .set(ISSUE_CYCLE_SETTINGS.IS_ENABLED, settings.isEnabled())
                .set(ISSUE_CYCLE_SETTINGS.WEEKS, settings.weeks())
                .set(ISSUE_CYCLE_SETTINGS.START_DAY, settings.startDay())
                .set(ISSUE_CYCLE_SETTINGS.UPCOMING, settings.upcoming())
                .set(ISSUE_CYCLE_SETTINGS.ADDS_STARTED, settings.addsStarted())
                .set(ISSUE_CYCLE_SETTINGS.ADDS_COMPLETED, settings.addsCompleted())
                .set(ISSUE_CYCLE_SETTINGS.UPDATED_AT, now)
                .set(ISSUE_CYCLE_SETTINGS.UPDATED_BY, actor)
                .execute();
    }
}

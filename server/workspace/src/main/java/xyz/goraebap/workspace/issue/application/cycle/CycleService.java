package xyz.goraebap.workspace.issue.application.cycle;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import xyz.goraebap.workspace.WorkspaceTransactional;
import xyz.goraebap.workspace.activity.ActivityEvent;
import xyz.goraebap.workspace.activity.ActivityFacade;
import xyz.goraebap.workspace.activity.ActivityOwner;
import xyz.goraebap.workspace.issue.application.IssueErrorCode;
import xyz.goraebap.workspace.issue.application.IssueProjects;
import xyz.goraebap.workspace.issue.application.body.IssueBodyService;
import xyz.goraebap.workspace.issue.domain.board.IssueColumn;
import xyz.goraebap.workspace.issue.domain.board.IssueColumnRepository;
import xyz.goraebap.workspace.issue.domain.cycle.Cycle;
import xyz.goraebap.workspace.issue.domain.cycle.CycleRepository;
import xyz.goraebap.workspace.issue.domain.cycle.CycleSettings;
import xyz.goraebap.workspace.issue.domain.cycle.CycleSettingsRepository;
import xyz.goraebap.workspace.issue.domain.issue.Issue;
import xyz.goraebap.workspace.issue.domain.issue.IssueActivity;
import xyz.goraebap.workspace.issue.domain.issue.IssueRepository;
import xyz.goraebap.workspace.project.ProjectSummary;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/**
 * A project's cycles (스프린트): anyone who may write in the project plans them; their days never overlap. Finishing one
 * passes its unfinished work items to another cycle (or none), each on its timeline; deleting one leaves its work items
 * in no cycle.
 */
@Service
@RequiredArgsConstructor
public class CycleService {
    private final CycleRepository cycleRepository;
    private final CycleQuery cycleQuery;
    private final IssueRepository issueRepository;
    private final IssueColumnRepository issueColumnRepository;
    private final IssueProjects issueProjects;
    private final ActivityFacade activityFacade;
    private final CycleSettingsRepository cycleSettingsRepository;
    private final Clock clock;

    /** The project's cycles; a project that keeps cycles running has the ones due made and the ones over finished first. */
    @WorkspaceTransactional
    public CycleModels.Cycles list(CurrentUser user, String key) {
        var project = issueProjects.readable(user, key);
        var settings = settingsOf(project);
        if (settings.isEnabled() && !project.archived()) plan(project, settings, null);
        var totals = cycleQuery.totals(project.id());
        LocalDate today = LocalDate.now(clock);
        return new CycleModels.Cycles(
                cycleRepository.findAllByProjectId(project.id()).stream()
                        .map(cycle -> view(cycle, today, totals.getOrDefault(cycle.id(), CycleModels.Totals.NONE)))
                        .toList(),
                model(settings),
                issueProjects.canWrite(user, project));
    }

    /** Changes how the project runs its cycles (its administrators); turned on, the cycles due are made at once. */
    @WorkspaceTransactional
    public void saveSettings(CurrentUser user, String key, CycleModels.Settings input) {
        var project = issueProjects.administered(user, key);
        var settings = new CycleSettings(
                project.id(),
                input.isEnabled(),
                input.weeks(),
                input.startDay(),
                input.upcoming(),
                input.addsStarted(),
                input.addsCompleted());
        cycleSettingsRepository.save(settings, user.id(), clock.instant());
        if (settings.isEnabled()) plan(project, settings, user.id());
        issueProjects.signal(project);
    }

    /**
     * Keeps a project's cycles running (Linear's automation): a cycle whose days are over is finished, its unfinished work
     * items passed to the cycle under way; the cycle under way and the next ones the settings ask for are made, each
     * starting the day after the last, named by their number.
     */
    private void plan(ProjectSummary project, CycleSettings settings, UUID actor) {
        LocalDate today = LocalDate.now(clock);
        Instant now = clock.instant();
        var cycles = new ArrayList<>(cycleRepository.findAllByProjectId(project.id()));
        LocalDate next = cycles.stream()
                .map(Cycle::endDate)
                .max(LocalDate::compareTo)
                .map(end -> end.plusDays(1))
                .orElse(settings.startOn(today));
        if (next.isBefore(settings.startOn(today))) next = settings.startOn(today);
        int number = cycles.size();
        long ahead = cycles.stream()
                .filter(cycle -> cycle.startDate().isAfter(today))
                .count();
        // A cycle under way is made only when the next one could start by today. When the cycles already run past today
        // (the one under way finished early), today stays in no cycle: making more would only add ones not begun, never
        // one under way, without end.
        boolean current =
                next.isAfter(today) || cycles.stream().anyMatch(cycle -> cycle.stateOn(today) == Cycle.State.CURRENT);
        while (!current || ahead < settings.upcoming()) {
            var cycle = Cycle.create(
                    UUID.randomUUID(),
                    project.id(),
                    "사이클 " + (++number),
                    null,
                    next,
                    next.plusDays(settings.days() - 1));
            cycleRepository.save(cycle, actor, now);
            cycles.add(cycle);
            if (cycle.stateOn(today) == Cycle.State.CURRENT) current = true;
            else if (cycle.startDate().isAfter(today)) ahead++;
            next = cycle.endDate().plusDays(1);
        }
        var running = cycles.stream()
                .filter(cycle -> cycle.stateOn(today) == Cycle.State.CURRENT)
                .findFirst()
                .orElse(null);
        for (Cycle cycle : cycles)
            if (cycle.stateOn(today) == Cycle.State.ENDED) finish(project, cycle, running, actor, now);
    }

    private CycleSettings settingsOf(ProjectSummary project) {
        return cycleSettingsRepository.find(project.id()).orElseGet(() -> CycleSettings.off(project.id()));
    }

    private static CycleModels.Settings model(CycleSettings settings) {
        return new CycleModels.Settings(
                settings.isEnabled(),
                settings.weeks(),
                settings.startDay(),
                settings.upcoming(),
                settings.addsStarted(),
                settings.addsCompleted());
    }

    @WorkspaceTransactional
    public UUID create(CurrentUser user, String key, CycleModels.Input input) {
        var project = issueProjects.writable(user, key);
        var cycle = Cycle.create(
                UUID.randomUUID(), project.id(), input.name(), input.goal(), input.startDate(), input.endDate());
        requireNoOverlap(project, cycle);
        cycleRepository.save(cycle, user.id(), clock.instant());
        issueProjects.signal(project);
        return cycle.id();
    }

    @WorkspaceTransactional
    public void edit(CurrentUser user, String key, UUID id, CycleModels.Input input) {
        var project = issueProjects.writable(user, key);
        var cycle = cycleOf(project, id);
        if (input.expectedVersion() == null || cycle.version() != input.expectedVersion())
            throw IssueErrorCode.ISSUE_CYCLE_VERSION_CONFLICT.raise();
        cycle.revise(input.name(), input.goal(), input.startDate(), input.endDate());
        requireNoOverlap(project, cycle);
        if (!cycleRepository.save(cycle, user.id(), clock.instant()))
            throw IssueErrorCode.ISSUE_CYCLE_VERSION_CONFLICT.raise();
        issueProjects.signal(project);
    }

    /** Finishes the cycle; its work items not done nor dropped go to moveTo (an unfinished cycle of the project) or none. */
    @WorkspaceTransactional
    public int complete(CurrentUser user, String key, UUID id, CycleModels.Completion completion) {
        var project = issueProjects.writable(user, key);
        var cycle = cycleOf(project, id);
        if (cycle.version() != completion.expectedVersion()) throw IssueErrorCode.ISSUE_CYCLE_VERSION_CONFLICT.raise();
        Cycle target = null;
        if (completion.moveTo() != null) {
            target = cycleOf(project, completion.moveTo());
            if (target.isCompleted() || target.id().equals(cycle.id()))
                throw IssueErrorCode.ISSUE_CYCLE_COMPLETED.raise();
        }
        int moved = finish(project, cycle, target, user.id(), clock.instant());
        issueProjects.signal(project);
        return moved;
    }

    private int finish(ProjectSummary project, Cycle cycle, Cycle target, UUID actor, Instant now) {
        cycle.complete(now);
        if (!cycleRepository.save(cycle, actor, now)) throw IssueErrorCode.ISSUE_CYCLE_VERSION_CONFLICT.raise();
        var closing = issueColumnRepository.findAllByProjectId(project.id()).stream()
                .filter(column -> column.category().closes())
                .map(IssueColumn::id)
                .toList();
        int moved = 0;
        for (Issue issue : issueRepository.findAllByCycleId(cycle.id())) {
            if (closing.contains(issue.columnId())) continue;
            issue.moveToCycle(target == null ? null : target.id());
            if (!issueRepository.save(issue, actor, now)) throw IssueErrorCode.ISSUE_VERSION_CONFLICT.raise();
            record(issue, cycle.name(), target == null ? null : target.name(), actor, now);
            moved++;
        }
        return moved;
    }

    @WorkspaceTransactional
    public void delete(CurrentUser user, String key, UUID id) {
        var project = issueProjects.writable(user, key);
        var cycle = cycleOf(project, id);
        Instant now = clock.instant();
        for (Issue issue : issueRepository.findAllByCycleId(cycle.id())) {
            issue.moveToCycle(null);
            if (!issueRepository.save(issue, user.id(), now)) throw IssueErrorCode.ISSUE_VERSION_CONFLICT.raise();
            record(issue, cycle.name(), null, user.id(), now);
        }
        cycleRepository.delete(cycle.id());
        issueProjects.signal(project);
    }

    private void requireNoOverlap(ProjectSummary project, Cycle cycle) {
        if (cycleRepository.findAllByProjectId(project.id()).stream().anyMatch(cycle::overlaps))
            throw IssueErrorCode.ISSUE_CYCLE_OVERLAP.raise();
    }

    private Cycle cycleOf(ProjectSummary project, UUID id) {
        return cycleRepository
                .findById(id)
                .filter(found -> found.projectId().equals(project.id()))
                .orElseThrow(IssueErrorCode.ISSUE_CYCLE_NOT_FOUND::raise);
    }

    private void record(Issue issue, String before, String after, UUID actor, Instant now) {
        activityFacade.record(
                new ActivityOwner(IssueBodyService.OWNER_TYPE, issue.id()),
                List.of(new ActivityEvent(IssueActivity.Field.CYCLE.name(), before, after, now, actor)));
    }

    private static CycleModels.View view(Cycle cycle, LocalDate today, CycleModels.Totals totals) {
        return new CycleModels.View(
                cycle.id(),
                cycle.name(),
                cycle.goal(),
                cycle.startDate(),
                cycle.endDate(),
                cycle.stateOn(today),
                cycle.completedAt(),
                cycle.version(),
                totals);
    }
}

package xyz.goraebap.module.workspace.issue.application.time;

import xyz.goraebap.module.workspace.project.WorkspaceRoles;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.module.foundation.user.UserFacade;
import xyz.goraebap.module.foundation.user.UserSummary;
import xyz.goraebap.module.workspace.activity.ActivityEvent;
import xyz.goraebap.module.workspace.activity.ActivityFacade;
import xyz.goraebap.module.workspace.activity.ActivityOwner;
import xyz.goraebap.module.workspace.issue.application.IssueErrorCode;
import xyz.goraebap.module.workspace.issue.application.IssueProjects;
import xyz.goraebap.module.workspace.issue.application.body.IssueBodyService;
import xyz.goraebap.module.workspace.issue.domain.issue.Effort;
import xyz.goraebap.module.workspace.issue.domain.issue.Issue;
import xyz.goraebap.module.workspace.issue.domain.issue.IssueActivity;
import xyz.goraebap.module.workspace.issue.domain.issue.IssueRepository;
import xyz.goraebap.module.workspace.issue.domain.time.TimeEntry;
import xyz.goraebap.module.workspace.issue.domain.time.TimeEntryRepository;
import xyz.goraebap.module.workspace.project.ProjectSummary;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * Time spent on work items (소요시간): anyone who may write in the project logs their own, on the work item's timeline
 * too; they delete their own, a Workspace administrator anyone's. The sum stands against the work item's estimate.
 */
@Service
@RequiredArgsConstructor
public class TimeEntryService {
    private final TimeEntryRepository timeEntryRepository;
    private final IssueRepository issueRepository;
    private final IssueProjects issueProjects;
    private final ActivityFacade activityFacade;
    private final UserFacade userFacade;
    private final Clock clock;

    @Transactional(readOnly = true)
    public TimeEntryModels.Entries list(CurrentUser user, String key, long number) {
        var issue = issueOf(issueProjects.readable(user, key), number);
        var entries = timeEntryRepository.findByIssueId(issue.id());
        Map<UUID, UserSummary> names =
                userFacade.summariesOf(entries.stream().map(TimeEntry::memberId).collect(Collectors.toSet()));
        int spent = entries.stream().mapToInt(TimeEntry::minutes).sum();
        Integer estimate = issue.details().estimateMinutes();
        return new TimeEntryModels.Entries(
                entries.stream()
                        .map(entry -> new TimeEntryModels.Entry(
                                entry.id(),
                                entry.memberId(),
                                names.containsKey(entry.memberId())
                                        ? names.get(entry.memberId()).name()
                                        : null,
                                entry.spentOn(),
                                hours(entry.minutes()),
                                entry.note(),
                                entry.createdAt(),
                                canDelete(user, entry)))
                        .toList(),
                hours(spent),
                estimate == null ? null : hours(estimate));
    }

    @Transactional
    public UUID log(CurrentUser user, String key, long number, TimeEntryModels.Log request) {
        var project = issueProjects.writable(user, key);
        var issue = issueOf(project, number);
        Instant now = clock.instant();
        Integer minutes = Effort.minutes(request.hours());
        var entry = TimeEntry.create(
                UUID.randomUUID(),
                issue.id(),
                user.id(),
                request.spentOn() == null ? LocalDate.now(clock) : request.spentOn(),
                minutes == null ? 0 : minutes,
                request.note(),
                now);
        timeEntryRepository.save(entry, user.id());
        record(issue, null, Effort.hours(entry.minutes()), user, now);
        issueProjects.signal(project);
        return entry.id();
    }

    @Transactional
    public void delete(CurrentUser user, String key, long number, UUID entryId) {
        var project = issueProjects.writable(user, key);
        var issue = issueOf(project, number);
        var entry = timeEntryRepository
                .findById(entryId)
                .filter(found -> found.issueId().equals(issue.id()))
                .orElseThrow(IssueErrorCode.ISSUE_NOT_FOUND::raise);
        if (!canDelete(user, entry)) throw new AccessDeniedException("자기 기록이나 워크스페이스 관리자만 지울 수 있습니다");
        timeEntryRepository.delete(entry.id());
        record(issue, Effort.hours(entry.minutes()), null, user, clock.instant());
        issueProjects.signal(project);
    }

    private void record(Issue issue, String before, String after, CurrentUser user, Instant now) {
        activityFacade.record(
                new ActivityOwner(IssueBodyService.OWNER_TYPE, issue.id()),
                List.of(new ActivityEvent(IssueActivity.Field.TIME_SPENT.name(), before, after, now, user.id())));
    }

    private static boolean canDelete(CurrentUser user, TimeEntry entry) {
        return WorkspaceRoles.admin(user) || entry.memberId().equals(user.id());
    }

    private Issue issueOf(ProjectSummary project, long number) {
        return issueRepository
                .findByProjectIdAndNumber(project.id(), number)
                .filter(issue -> !issue.isDeleted())
                .orElseThrow(IssueErrorCode.ISSUE_NOT_FOUND::raise);
    }

    private static double hours(int minutes) {
        return Math.round(minutes / 60.0 * 100) / 100.0;
    }
}

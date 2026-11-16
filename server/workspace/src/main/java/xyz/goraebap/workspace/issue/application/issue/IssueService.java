package xyz.goraebap.workspace.issue.application.issue;

import org.springframework.beans.factory.annotation.Qualifier;
import xyz.goraebap.workspace.WorkspaceDatabaseConfig;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import xyz.goraebap.workspace.WorkspaceTransactional;
import xyz.goraebap.foundation.notification.Notice;
import xyz.goraebap.foundation.notification.NotificationOutbox;
import xyz.goraebap.foundation.outbox.Outbox;
import xyz.goraebap.foundation.notification.Subject;
import xyz.goraebap.foundation.user.UserFacade;
import xyz.goraebap.foundation.user.UserSummary;
import xyz.goraebap.workspace.activity.ActivityEntry;
import xyz.goraebap.workspace.activity.ActivityEvent;
import xyz.goraebap.workspace.activity.ActivityFacade;
import xyz.goraebap.workspace.activity.ActivityOwner;
import xyz.goraebap.workspace.issue.application.IssueErrorCode;
import xyz.goraebap.workspace.issue.application.IssueProjects;
import xyz.goraebap.workspace.issue.application.body.IssueBodyService;
import xyz.goraebap.workspace.issue.application.type.TypeService;
import xyz.goraebap.workspace.issue.domain.board.ColumnCategory;
import xyz.goraebap.workspace.issue.domain.board.IssueColumn;
import xyz.goraebap.workspace.issue.domain.board.IssueColumnRepository;
import xyz.goraebap.workspace.issue.domain.cycle.Cycle;
import xyz.goraebap.workspace.issue.domain.cycle.CycleRepository;
import xyz.goraebap.workspace.issue.domain.issue.Effort;
import xyz.goraebap.workspace.issue.domain.issue.Issue;
import xyz.goraebap.workspace.issue.domain.issue.IssueActivity;
import xyz.goraebap.workspace.issue.domain.issue.IssuePriority;
import xyz.goraebap.workspace.issue.domain.issue.IssueRepository;
import xyz.goraebap.workspace.issue.domain.label.IssueLabel;
import xyz.goraebap.workspace.issue.domain.label.IssueLabelRepository;
import xyz.goraebap.workspace.project.ProjectFacade;
import xyz.goraebap.workspace.project.ProjectRole;
import xyz.goraebap.workspace.project.ProjectSummary;
import xyz.goraebap.foundation.shared.error.CommonErrorCode;
import xyz.goraebap.foundation.shared.web.CurrentUser;
import xyz.goraebap.foundation.shared.web.SortDirection;

/**
 * Making and changing a project's issues (BIT's work items, the decided permissions): any member writes the issues of a
 * project that is not archived. A new issue takes the project's next number. Properties change together over the
 * version read; moving on the board puts an issue between its neighbours without asking for a version. Each change is
 * written to the issue's timeline, a new assignee other than the one acting is told, and every screen hears of it.
 */
@Service
@RequiredArgsConstructor
public class IssueService {
    /** No cycle at all: what a cycle filter names when no cycle matches, so it finds nothing. */
    private static final UUID NO_CYCLE = new UUID(0, 0);
    /** The gap left between neighbours on the board when an issue goes first or last. */
    static final double STEP = 1024;

    /** How far up the parents go before a loop is assumed; deeper trees are refused. */
    private static final int DEPTH_MAX = 100;

    private static final Pattern REF = Pattern.compile("^([A-Za-z0-9]{2,10})-(\\d{1,12})$");

    private final IssueRepository issueRepository;
    private final ActivityFacade activityFacade;
    private final IssueColumnRepository issueColumnRepository;
    private final IssueLabelRepository issueLabelRepository;
    private final TypeService typeService;
    private final IssueQuery issueQuery;
    private final IssueProjects issueProjects;
    private final ProjectFacade projectFacade;
    private final UserFacade userFacade;
    /** What a notice about an issue names as its subject. */
    static final String SUBJECT = "ISSUE";

    private final NotificationOutbox notificationOutbox;

    @Qualifier(WorkspaceDatabaseConfig.DSL)
    private final Outbox outbox;
    private final Clock clock;
    private final CycleRepository cycleRepository;
    private final xyz.goraebap.workspace.issue.domain.cycle.CycleSettingsRepository cycleSettingsRepository;

    /** A project's issues, by default in board order. */
    @WorkspaceTransactional(readOnly = true)
    public IssueViews.IssueSlice list(CurrentUser user, String key, IssueRequests.Listing listing) {
        var project = issueProjects.readable(user, key);
        var sort = listing.sort() == null ? IssueRequests.Sort.BOARD : listing.sort();
        return slice(user, List.of(project.id()), listing, sort);
    }

    @WorkspaceTransactional(readOnly = true)
    public IssueQuery.ChangeSlice changes(
            CurrentUser user, String key, Instant since, Instant until, String cursor, int size) {
        var projects = key == null
                ? areaProjects(user, List.of())
                : Optional.of(List.of(issueProjects.readable(user, key).id()));
        if (projects.isEmpty()) return new IssueQuery.ChangeSlice(List.of(), null);
        return issueQuery.changes(projects.get(), since, until, cursor, size);
    }

    /** Issues across the live projects the user sees (or those of them named), by default the latest changed first. */
    @WorkspaceTransactional(readOnly = true)
    public IssueViews.IssueSlice listAll(CurrentUser user, IssueRequests.Listing listing) {
        var projectIds = areaProjects(user, listing.project());
        if (projectIds.isEmpty()) return new IssueViews.IssueSlice(List.of(), null);
        var sort = listing.sort() == null ? IssueRequests.Sort.UPDATED : listing.sort();
        return slice(user, projectIds.get(), listing, sort);
    }

    /**
     * The projects an area-wide list reads: those named that the user sees, or with none named every project they see.
     * An empty list stands for every project (a Workspace administrator's); nothing to read is empty.
     */
    private Optional<List<UUID>> areaProjects(CurrentUser user, List<String> keys) {
        var visible = issueProjects.visibleTo(user);
        if (keys.isEmpty()) {
            if (visible.all()) return Optional.of(List.of());
            return visible.ids().isEmpty() ? Optional.empty() : Optional.of(List.copyOf(visible.ids()));
        }
        var named = keys.stream()
                .map(projectFacade::findByKey)
                .flatMap(Optional::stream)
                .filter(project -> !project.deleted() && visible.contains(project.id()))
                .map(ProjectSummary::id)
                .distinct()
                .toList();
        return named.isEmpty() ? Optional.empty() : Optional.of(named);
    }

    @WorkspaceTransactional(readOnly = true)
    public List<IssueViews.IssueGroup> groups(
            CurrentUser user, String key, IssueRequests.Listing listing, IssueRequests.Grouping grouping) {
        var scope = key != null
                ? Optional.of(List.of(issueProjects.readable(user, key).id()))
                : areaProjects(user, listing.project());
        if (scope.isEmpty()) return List.of();
        List<UUID> projects = scope.get();
        var groups = issueQuery.groups(
                filter(user, projects, listing, Objects.requireNonNullElse(listing.sort(), IssueRequests.Sort.UPDATED)),
                grouping,
                key == null);
        if (grouping != IssueRequests.Grouping.ASSIGNEE) return groups;
        var names = userFacade.summariesOf(groups.stream()
                .filter(g -> !g.id().equals("none"))
                .map(g -> UUID.fromString(g.id()))
                .collect(java.util.stream.Collectors.toSet()));
        return groups.stream()
                .map(g -> new IssueViews.IssueGroup(
                        g.id(),
                        g.id().equals("none")
                                ? "담당자 없음"
                                : Objects.requireNonNullElse(nameOf(names, UUID.fromString(g.id())), "이름 없음"),
                        g.category(),
                        g.total(),
                        g.columnIds()))
                .sorted(Comparator.comparing((IssueViews.IssueGroup g) -> g.id().equals("none"))
                        .thenComparing(IssueViews.IssueGroup::name, java.text.Collator.getInstance(Locale.KOREAN)))
                .toList();
    }

    @WorkspaceTransactional(readOnly = true)
    public IssueViews.IssueView get(CurrentUser user, String key, long number) {
        var project = issueProjects.readable(user, key);
        return view(user, project, issueIdOf(project, number));
    }

    /** One issue by its reference, KEY-number, its project's key current or old. */
    @WorkspaceTransactional(readOnly = true)
    public IssueViews.IssueView getByRef(CurrentUser user, String ref) {
        var matched = REF.matcher(ref == null ? "" : ref.strip());
        if (!matched.matches()) throw IssueErrorCode.ISSUE_NOT_FOUND.raise();
        var project = projectFacade
                .findByKey(matched.group(1).toUpperCase(Locale.ROOT))
                .filter(found -> !found.deleted())
                .filter(found -> issueProjects.roleOf(user, found).atLeast(ProjectRole.VIEWER))
                .orElseThrow(IssueErrorCode.ISSUE_NOT_FOUND::raise);
        return view(user, project, issueIdOf(project, Long.parseLong(matched.group(2))));
    }

    /** The issue's comments and what happened to it, oldest first, each with who did it. */
    @WorkspaceTransactional(readOnly = true)
    public List<IssueViews.TimelineEntry> timeline(CurrentUser user, String key, long number) {
        var project = issueProjects.readable(user, key);
        UUID issueId = issueIdOf(project, number);
        var timeline = activityFacade.timeline(new ActivityOwner(IssueBodyService.OWNER_TYPE, issueId));
        var people = new HashSet<UUID>();
        timeline.forEach(entry -> {
            people.add(entry.actorId());
            people.add(entry.resolvedBy());
            if (IssueActivity.Field.ASSIGNEE.name().equals(entry.field())) {
                people.add(uuid(entry.before()));
                people.add(uuid(entry.after()));
            }
        });
        people.remove(null);
        var names = userFacade.summariesOf(people);
        var entries = new ArrayList<IssueViews.TimelineEntry>();
        for (var entry : timeline) {
            boolean comment = entry.kind() == ActivityEntry.Kind.COMMENT;
            boolean person = IssueActivity.Field.ASSIGNEE.name().equals(entry.field());
            entries.add(new IssueViews.TimelineEntry(
                    comment ? IssueViews.TimelineKind.COMMENT : IssueViews.TimelineKind.ACTIVITY,
                    entry.id(),
                    entry.at(),
                    entry.actorId(),
                    nameOf(names, entry.actorId()),
                    entry.body(),
                    entry.quote(),
                    entry.parentId(),
                    entry.editedAt(),
                    comment ? null : IssueActivity.Field.valueOf(entry.field()),
                    person ? nameOf(names, uuid(entry.before())) : entry.before(),
                    person ? nameOf(names, uuid(entry.after())) : entry.after(),
                    entry.agent(),
                    entry.blockId(),
                    entry.resolvedAt(),
                    nameOf(names, entry.resolvedBy())));
        }
        entries.sort(Comparator.comparing(IssueViews.TimelineEntry::at).thenComparing(IssueViews.TimelineEntry::id));
        return entries;
    }

    private IssueViews.IssueSlice slice(
            CurrentUser user, List<UUID> projectIds, IssueRequests.Listing listing, IssueRequests.Sort sort) {
        var filter = filter(user, projectIds, listing, sort);
        var slice = issueQuery.findAll(filter, listing.cursor(), listing.size());
        return new IssueViews.IssueSlice(named(slice.rows()), slice.nextCursor());
    }

    private IssueQuery.Filter filter(
            CurrentUser user, List<UUID> projectIds, IssueRequests.Listing listing, IssueRequests.Sort sort) {
        var assigneeIds = new ArrayList<UUID>();
        boolean unassigned = false;
        for (String assignee : listing.assignee()) {
            if (assignee.equalsIgnoreCase("me")) assigneeIds.add(user.id());
            else if (assignee.equalsIgnoreCase("none")) unassigned = true;
            else {
                UUID id = uuid(assignee);
                if (id == null) throw CommonErrorCode.COMMON_INVALID_REQUEST.raise("담당자 값이 올바르지 않습니다");
                assigneeIds.add(id);
            }
        }
        var cycleIds = new ArrayList<UUID>();
        boolean noCycle = false;
        for (String cycle : listing.cycle()) {
            if (cycle.equalsIgnoreCase("none")) noCycle = true;
            else if (cycle.equalsIgnoreCase("current")) {
                // Each project's cycle under way; none under way matches nothing (an unknown id).
                LocalDate today = LocalDate.now(clock);
                for (UUID project : projectIds)
                    cycleIds.add(cycleRepository.findAllByProjectId(project).stream()
                            .filter(each -> each.stateOn(today) == Cycle.State.CURRENT)
                            .map(Cycle::id)
                            .findFirst()
                            .orElse(NO_CYCLE));
                if (projectIds.isEmpty()) cycleIds.add(NO_CYCLE);
            } else {
                UUID id = uuid(cycle);
                if (id == null) throw CommonErrorCode.COMMON_INVALID_REQUEST.raise("사이클 값이 올바르지 않습니다");
                cycleIds.add(id);
            }
        }
        var direction = sort == IssueRequests.Sort.BOARD
                ? SortDirection.ASC
                : Objects.requireNonNullElse(listing.direction(), SortDirection.DESC);
        return new IssueQuery.Filter(
                projectIds,
                listing.columnId(),
                listing.category(),
                assigneeIds,
                unassigned,
                listing.labelId(),
                listing.type(),
                listing.priority(),
                cycleIds,
                noCycle,
                listing.q(),
                listing.parentId(),
                sort,
                direction);
    }

    private IssueViews.IssueView view(CurrentUser user, ProjectSummary project, UUID issueId) {
        var row = issueQuery.findRow(issueId).orElseThrow(IssueErrorCode.ISSUE_NOT_FOUND::raise);
        var parent = Optional.ofNullable(row.parentId())
                .flatMap(issueQuery::findRow)
                .map(found -> new IssueViews.IssueRef(
                        found.id(), found.ref(), found.number(), found.title(), found.category()))
                .orElse(null);
        var children = issueQuery.findChildren(issueId);
        var creator = issueQuery.findCreatorId(issueId).orElse(null);
        var rows = named(Stream.concat(Stream.of(row), children.stream()).toList());
        var names = creator == null ? Map.<UUID, UserSummary>of() : userFacade.summariesOf(List.of(creator));
        return new IssueViews.IssueView(
                rows.getFirst(),
                parent,
                rows.subList(1, rows.size()),
                creator,
                nameOf(names, creator),
                issueProjects.canWrite(user, project));
    }

    private UUID issueIdOf(ProjectSummary project, long number) {
        return issueRepository
                .findByProjectIdAndNumber(project.id(), number)
                .filter(issue -> !issue.isDeleted())
                .map(Issue::id)
                .orElseThrow(IssueErrorCode.ISSUE_NOT_FOUND::raise);
    }

    /** The rows with their assignees' names, read in one batch. */
    private List<IssueViews.IssueRow> named(List<IssueViews.IssueRow> rows) {
        var ids = rows.stream()
                .map(IssueViews.IssueRow::assigneeId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (ids.isEmpty()) return rows;
        var names = userFacade.summariesOf(ids);
        return rows.stream()
                .map(row -> row.named(nameOf(names, row.assigneeId())))
                .toList();
    }

    private static String nameOf(Map<UUID, UserSummary> names, UUID id) {
        if (id == null) return null;
        var found = names.get(id);
        return found == null ? null : found.name();
    }

    private static UUID uuid(String value) {
        if (value == null) return null;
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException invalid) {
            return null;
        }
    }

    /** A new issue at the end of its column; its number comes back. */
    @WorkspaceTransactional
    public long create(CurrentUser user, String key, IssueRequests.CreateIssue request) {
        var project = issueProjects.writable(user, key);
        var issue = make(project, user.id(), clock.instant(), request, true);
        notifyAssignee(user, project, issue, null);
        return issue.number();
    }

    /**
     * An issue brought from elsewhere by an importer, written by author at the given moment: made
     * then at the end of its column with the project's next number, as the screens make one, but nobody is told, as
     * nothing new is given to anyone, and nothing is filled in for it (it says what it said there). Its number comes back.
     */
    @WorkspaceTransactional
    public long create(UUID author, Instant at, String key, IssueRequests.CreateIssue request) {
        return make(issueProjects.open(key), author, at, request, false).number();
    }

    /** Every property at once over the version read; a new column puts the issue at that column's end. */
    @WorkspaceTransactional
    public void edit(CurrentUser user, String key, long number, IssueRequests.EditIssue request) {
        var project = issueProjects.writable(user, key);
        var issue = liveIssue(project, number);
        if (issue.version() != request.expectedVersion()) throw IssueErrorCode.ISSUE_VERSION_CONFLICT.raise();
        var before = issue.details();
        UUID columnBefore = issue.columnId();
        var details = Issue.Details.of(
                request.title(),
                typeService.codeOf(request.type()),
                request.priority(),
                request.assigneeId(),
                request.startDate(),
                request.dueDate(),
                request.parentId(),
                request.labelIds(),
                Effort.minutes(request.estimateHours()),
                request.storyPoints(),
                request.cycleId());
        if (!Objects.equals(before.assigneeId(), details.assigneeId())) requireAssignee(details.assigneeId());
        if (!Objects.equals(before.parentId(), details.parentId()))
            requireParent(project, issue.id(), details.parentId());
        if (!Objects.equals(before.cycleId(), details.cycleId())) requireCycle(project, details.cycleId());
        var labels = requireLabels(project, details.labelIds());
        var columns = issueColumnRepository.findAllByProjectId(project.id());
        var column = columnIn(columns, request.columnId());
        Instant now = clock.instant();
        issue.revise(details);
        if (!column.id().equals(columnBefore)) {
            issue.moveTo(
                    column.id(),
                    column.category(),
                    issueRepository
                            .findLastPositionByColumnId(column.id(), issue.id())
                            .map(last -> last + STEP)
                            .orElse(STEP),
                    user.id(),
                    LocalDate.now(clock),
                    now);
            joinRunningCycle(project, issue, column.category());
            // What the new status filled in (assignee, dates, cycle) is part of what changed.
            details = issue.details();
        }
        if (!issueRepository.save(issue, user.id(), now)) throw IssueErrorCode.ISSUE_VERSION_CONFLICT.raise();
        var changes = new ArrayList<IssueActivity>();
        change(changes, issue, IssueActivity.Field.TITLE, before.title(), details.title(), user, now);
        change(
                changes,
                issue,
                IssueActivity.Field.TYPE,
                typeService.nameOf(before.type()),
                typeService.nameOf(details.type()),
                user,
                now);
        change(changes, issue, IssueActivity.Field.STATUS, nameOf(columns, columnBefore), column.name(), user, now);
        change(
                changes,
                issue,
                IssueActivity.Field.PRIORITY,
                before.priority().name(),
                details.priority().name(),
                user,
                now);
        change(
                changes,
                issue,
                IssueActivity.Field.ASSIGNEE,
                text(before.assigneeId()),
                text(details.assigneeId()),
                user,
                now);
        change(
                changes,
                issue,
                IssueActivity.Field.START_DATE,
                text(before.startDate()),
                text(details.startDate()),
                user,
                now);
        change(
                changes,
                issue,
                IssueActivity.Field.DUE_DATE,
                text(before.dueDate()),
                text(details.dueDate()),
                user,
                now);
        change(
                changes,
                issue,
                IssueActivity.Field.PARENT,
                refOf(project, before.parentId()),
                refOf(project, details.parentId()),
                user,
                now);
        change(
                changes,
                issue,
                IssueActivity.Field.ESTIMATE,
                Effort.hours(before.estimateMinutes()),
                Effort.hours(details.estimateMinutes()),
                user,
                now);
        change(
                changes,
                issue,
                IssueActivity.Field.STORY_POINTS,
                points(before.storyPoints()),
                points(details.storyPoints()),
                user,
                now);
        if (!Objects.equals(before.cycleId(), details.cycleId()))
            change(
                    changes,
                    issue,
                    IssueActivity.Field.CYCLE,
                    cycleName(before.cycleId()),
                    cycleName(details.cycleId()),
                    user,
                    now);
        change(
                changes,
                issue,
                IssueActivity.Field.LABELS,
                names(labels, before.labelIds()),
                names(labels, details.labelIds()),
                user,
                now);
        record(changes);
        notifyAssignee(user, project, issue, before.assigneeId());
        issueProjects.signal(project);
    }

    /** Puts the issue on the board right after another in a column, or first; the column may be another one. */
    @WorkspaceTransactional
    public void move(CurrentUser user, String key, long number, IssueRequests.Move request) {
        var project = issueProjects.writable(user, key);
        var issue = liveIssue(project, number);
        var columns = issueColumnRepository.findAllByProjectId(project.id());
        var column = columnIn(columns, request.columnId());
        UUID columnBefore = issue.columnId();
        double position;
        if (request.afterId() == null)
            position = issueRepository
                    .findFirstPositionByColumnId(column.id(), issue.id())
                    .map(first -> first - STEP)
                    .orElse(STEP);
        else {
            if (request.afterId().equals(issue.id())) throw IssueErrorCode.ISSUE_NOT_FOUND.raise();
            var after = issueRepository
                    .findById(request.afterId())
                    .filter(found -> !found.isDeleted() && found.columnId().equals(column.id()))
                    .orElseThrow(IssueErrorCode.ISSUE_NOT_FOUND::raise);
            position = issueRepository
                    .findPositionAfter(column.id(), after.position(), issue.id())
                    .map(next -> (after.position() + next) / 2)
                    .orElse(after.position() + STEP);
        }
        Instant now = clock.instant();
        var before = issue.details();
        issue.moveTo(column.id(), column.category(), position, user.id(), LocalDate.now(clock), now);
        joinRunningCycle(project, issue, column.category());
        if (!issueRepository.save(issue, user.id(), now)) throw IssueErrorCode.ISSUE_VERSION_CONFLICT.raise();
        var changes = new ArrayList<IssueActivity>();
        change(changes, issue, IssueActivity.Field.STATUS, nameOf(columns, columnBefore), column.name(), user, now);
        settled(changes, issue, before, user.id(), now);
        if (!Objects.equals(before.cycleId(), issue.details().cycleId()))
            change(
                    changes,
                    issue,
                    IssueActivity.Field.CYCLE,
                    null,
                    cycleName(issue.details().cycleId()),
                    user,
                    now);
        record(changes);
        issueProjects.signal(project);
    }

    /**
     * A repository's rule moves the work item (저장소 연동): to the top of the column, by nobody, on its timeline as
     * any move is. The project must be live and not archived; a work item already there stays.
     */
    @WorkspaceTransactional
    public void moveByRule(UUID issueId, UUID columnId) {
        var issue = issueRepository
                .findById(issueId)
                .filter(found -> !found.isDeleted())
                .orElse(null);
        if (issue == null || issue.columnId().equals(columnId)) return;
        var columns = issueColumnRepository.findAllByProjectId(issue.projectId());
        var column = columns.stream()
                .filter(each -> each.id().equals(columnId))
                .findFirst()
                .orElse(null);
        if (column == null) return;
        UUID columnBefore = issue.columnId();
        double position = issueRepository
                .findFirstPositionByColumnId(column.id(), issue.id())
                .map(first -> first - STEP)
                .orElse(STEP);
        Instant now = clock.instant();
        var before = issue.details();
        issue.moveTo(column.id(), column.category(), position, null, LocalDate.now(clock), now);
        if (!issueRepository.save(issue, null, now)) throw IssueErrorCode.ISSUE_VERSION_CONFLICT.raise();
        var changes = new ArrayList<IssueActivity>();
        changes.add(new IssueActivity(
                UUID.randomUUID(),
                issue.id(),
                IssueActivity.Field.STATUS,
                nameOf(columns, columnBefore),
                column.name(),
                now,
                null));
        settled(changes, issue, before, null, now);
        record(changes);
    }

    /** Deletes the issue, kept for its number and history; its maker (an editor) or the project's administrators may. */
    @WorkspaceTransactional
    public void delete(CurrentUser user, String key, long number, long expectedVersion) {
        var project = issueProjects.writable(user, key);
        var issue = liveIssue(project, number);
        if (!issueProjects.roleOf(user, project).atLeast(ProjectRole.ADMIN)
                && !issueQuery.findCreatorId(issue.id()).map(user.id()::equals).orElse(false))
            throw new AccessDeniedException("이슈를 만든 사람이나 프로젝트 관리자만 지울 수 있습니다");
        if (issue.version() != expectedVersion) throw IssueErrorCode.ISSUE_VERSION_CONFLICT.raise();
        Instant now = clock.instant();
        issue.delete(now);
        if (!issueRepository.save(issue, user.id(), now)) throw IssueErrorCode.ISSUE_VERSION_CONFLICT.raise();
        record(List.of(new IssueActivity(
                UUID.randomUUID(), issue.id(), IssueActivity.Field.DELETED, null, null, now, user.id())));
        notificationOutbox.closed(outbox, Subject.of(SUBJECT, issue.id()));
        issueProjects.signal(project);
    }

    /** A new issue at the end of its column, made by author at the given moment; every screen hears of it. */
    private Issue make(
            ProjectSummary project, UUID author, Instant at, IssueRequests.CreateIssue request, boolean fills) {
        var columns = columnsOf(project, author);
        var column = request.columnId() == null
                ? columns.stream()
                        .filter(each -> each.category() == ColumnCategory.UNSTARTED)
                        .findFirst()
                        .orElse(columns.getFirst())
                : columnIn(columns, request.columnId());
        var details = Issue.Details.of(
                request.title(),
                typeService.codeOf(request.type()),
                // A work item made with no priority said is an ordinary one (보통), not one without any.
                fills && request.priority() == null ? IssuePriority.MEDIUM : request.priority(),
                request.assigneeId(),
                request.startDate(),
                request.dueDate(),
                request.parentId(),
                request.labelIds(),
                Effort.minutes(request.estimateHours()),
                request.storyPoints(),
                request.cycleId());
        UUID id = UUID.randomUUID();
        requireAssignee(details.assigneeId());
        requireParent(project, id, details.parentId());
        requireLabels(project, details.labelIds());
        requireCycle(project, details.cycleId());
        double position = issueRepository
                .findLastPositionByColumnId(column.id(), null)
                .map(last -> last + STEP)
                .orElse(STEP);
        var issue = Issue.create(
                id,
                project.id(),
                projectFacade.takeWorkItemNumber(project.id()),
                details,
                column.id(),
                column.category().closes(),
                position,
                at);
        // Made already under way or done (an agent recording what it did): what that status says is filled as on a
        // move.
        if (fills) {
            issue.settle(column.category(), author, LocalDate.now(clock), at);
            joinRunningCycle(project, issue, column.category());
        }
        issueRepository.save(issue, author, at);
        record(List.of(new IssueActivity(UUID.randomUUID(), id, IssueActivity.Field.CREATED, null, null, at, author)));
        issueProjects.signal(project);
        return issue;
    }

    /** The project's columns; a project made before boards came, or outside this area, gets BIT's board first. */
    private List<IssueColumn> columnsOf(ProjectSummary project, UUID actor) {
        var columns = issueColumnRepository.findAllByProjectId(project.id());
        if (!columns.isEmpty()) return columns;
        var board = IssueColumn.defaults(project.id());
        issueColumnRepository.saveAll(board, actor, clock.instant());
        return board;
    }

    private Issue liveIssue(ProjectSummary project, long number) {
        return issueRepository
                .findByProjectIdAndNumber(project.id(), number)
                .filter(issue -> !issue.isDeleted())
                .orElseThrow(IssueErrorCode.ISSUE_NOT_FOUND::raise);
    }

    private static IssueColumn columnIn(List<IssueColumn> columns, UUID columnId) {
        return columns.stream()
                .filter(column -> column.id().equals(columnId))
                .findFirst()
                .orElseThrow(IssueErrorCode.ISSUE_COLUMN_NOT_FOUND::raise);
    }

    private static String nameOf(List<IssueColumn> columns, UUID columnId) {
        return columns.stream()
                .filter(column -> column.id().equals(columnId))
                .map(IssueColumn::name)
                .findFirst()
                .orElse(null);
    }

    /** The assignee must be someone who works here. */
    private void requireAssignee(UUID assigneeId) {
        if (assigneeId != null
                && !Boolean.FALSE.equals(userFacade.hasLeft(assigneeId).orElse(true)))
            throw IssueErrorCode.ISSUE_ASSIGNEE_NOT_FOUND.raise();
    }

    /** The parent must be a live issue of the same project that is not the issue itself nor below it. */
    private void requireParent(ProjectSummary project, UUID issueId, UUID parentId) {
        if (parentId == null) return;
        var parent = issueRepository
                .findById(parentId)
                .filter(found -> !found.isDeleted() && found.projectId().equals(project.id()))
                .orElseThrow(IssueErrorCode.ISSUE_PARENT_INVALID::raise);
        UUID at = parent.id();
        for (int depth = 0; at != null; depth++) {
            if (at.equals(issueId) || depth > DEPTH_MAX) throw IssueErrorCode.ISSUE_PARENT_INVALID.raise();
            at = issueRepository.findParentIdById(at).orElse(null);
        }
    }

    /** The labels must be the workspace's; its labels come back to name them. */
    private List<IssueLabel> requireLabels(ProjectSummary project, Set<UUID> labelIds) {
        var labels = issueLabelRepository.findAll();
        var known = labels.stream().map(IssueLabel::id).collect(Collectors.toSet());
        if (!known.containsAll(labelIds)) throw IssueErrorCode.ISSUE_LABEL_NOT_FOUND.raise();
        return labels;
    }

    private String refOf(ProjectSummary project, UUID issueId) {
        if (issueId == null) return null;
        return issueRepository
                .findById(issueId)
                .map(found -> IssueProjects.ref(project, found.number()))
                .orElse(null);
    }

    private static String names(List<IssueLabel> labels, Set<UUID> ids) {
        var chosen = new HashSet<>(ids);
        String joined = labels.stream()
                .filter(label -> chosen.contains(label.id()))
                .map(IssueLabel::name)
                .collect(Collectors.joining(", "));
        return joined.isEmpty() ? null : joined;
    }

    private static String points(Double points) {
        return points == null
                ? null
                : java.math.BigDecimal.valueOf(points).stripTrailingZeros().toPlainString();
    }

    private static String text(Object value) {
        return value == null ? null : value.toString();
    }

    private static void change(
            List<IssueActivity> changes,
            Issue issue,
            IssueActivity.Field field,
            String before,
            String after,
            CurrentUser user,
            Instant now) {
        // Changes made at once a microsecond apart, so the timeline keeps the order they are listed in.
        if (!Objects.equals(before, after))
            changes.add(new IssueActivity(
                    UUID.randomUUID(),
                    issue.id(),
                    field,
                    before,
                    after,
                    now.plus(changes.size(), ChronoUnit.MICROS),
                    user.id()));
    }

    /**
     * Cycle automation (프로젝트 설정 · 사이클): a work item that gets under way or done with no cycle goes into the cycle
     * under way when the project asks for it.
     */
    private void joinRunningCycle(ProjectSummary project, Issue issue, ColumnCategory category) {
        if (issue.details().cycleId() != null) return;
        var settings = cycleSettingsRepository.find(project.id()).orElse(null);
        if (settings == null || !settings.isEnabled()) return;
        if (!(category == ColumnCategory.STARTED && settings.addsStarted()
                || category == ColumnCategory.COMPLETED && settings.addsCompleted())) return;
        LocalDate today = LocalDate.now(clock);
        cycleRepository.findAllByProjectId(project.id()).stream()
                .filter(cycle -> cycle.stateOn(today) == Cycle.State.CURRENT)
                .findFirst()
                .ifPresent(cycle -> issue.moveToCycle(cycle.id()));
    }

    /** A cycle given to an issue is one of its project's, not finished. */
    private void requireCycle(ProjectSummary project, UUID cycleId) {
        if (cycleId == null) return;
        var cycle = cycleRepository
                .findById(cycleId)
                .filter(found -> found.projectId().equals(project.id()))
                .orElseThrow(IssueErrorCode.ISSUE_CYCLE_NOT_FOUND::raise);
        if (cycle.isCompleted()) throw IssueErrorCode.ISSUE_CYCLE_COMPLETED.raise();
    }

    private String cycleName(UUID cycleId) {
        return cycleId == null
                ? null
                : cycleRepository.findById(cycleId).map(Cycle::name).orElse(null);
    }

    /** What a status filled in on the way (Issue.settle), on the timeline after the move itself. */
    private static void settled(
            List<IssueActivity> changes, Issue issue, Issue.Details before, UUID actor, Instant now) {
        var after = issue.details();
        var filled = new java.util.LinkedHashMap<IssueActivity.Field, String[]>();
        filled.put(IssueActivity.Field.ASSIGNEE, new String[] {text(before.assigneeId()), text(after.assigneeId())});
        filled.put(IssueActivity.Field.START_DATE, new String[] {text(before.startDate()), text(after.startDate())});
        filled.put(IssueActivity.Field.DUE_DATE, new String[] {text(before.dueDate()), text(after.dueDate())});
        filled.forEach((field, values) -> {
            if (!Objects.equals(values[0], values[1]))
                changes.add(new IssueActivity(
                        UUID.randomUUID(),
                        issue.id(),
                        field,
                        values[0],
                        values[1],
                        now.plus(changes.size(), ChronoUnit.MICROS),
                        actor));
        });
    }

    /** Tells a new assignee, unless they gave it to themselves. */
    private void notifyAssignee(CurrentUser user, ProjectSummary project, Issue issue, UUID before) {
        UUID assignee = issue.details().assigneeId();
        if (assignee == null || assignee.equals(before) || assignee.equals(user.id())) return;
        String ref = IssueProjects.ref(project, issue.number());
        notificationOutbox.send(outbox, Notice.toSee(
                Subject.of(SUBJECT, issue.id()),
                "ISSUE_ASSIGNED",
                user.id(),
                "이슈 담당자가 되었어요",
                ref + " " + issue.details().title(),
                "/workspace/projects/" + project.key() + "/work-items/" + issue.number(),
                List.of(assignee)));
    }

    /** Puts what happened to an issue on its timeline (the common activity, by the issue's rich body owner type). */
    private void record(List<IssueActivity> activities) {
        if (activities.isEmpty()) return;
        activityFacade.record(
                new ActivityOwner(
                        IssueBodyService.OWNER_TYPE, activities.getFirst().issueId()),
                activities.stream()
                        .map(each -> new ActivityEvent(
                                each.field().name(), each.before(), each.after(), each.at(), each.actorId()))
                        .toList());
    }
}

package xyz.goraebap.module.workspace.document.application.system;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.module.foundation.user.UserFacade;
import xyz.goraebap.module.foundation.user.UserSummary;
import xyz.goraebap.module.workspace.document.SystemKind;
import xyz.goraebap.module.workspace.document.SystemReachSpi;
import xyz.goraebap.module.workspace.document.application.access.ReaderQuery;
import xyz.goraebap.module.workspace.project.ProjectFacade;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * 문서함's system folders as a member sees them (docs/pending-records.md, 문서함): each kind its module keeps, within the
 * reach the module gives (SystemReachSpi), the member's own always; a project's folder holds that project's 회의록. A
 * meeting is narrowed by its project, a report by its department; names are joined once the page is chosen.
 */
@Service
public class SystemFolderService {
    private final Map<SystemKind, SystemReachSpi> reaches;
    private final SystemFolderQuery systemFolderQuery;
    private final ProjectFacade projectFacade;
    private final ReaderQuery readerQuery;
    private final UserFacade userFacade;

    public SystemFolderService(
            List<SystemReachSpi> reaches,
            SystemFolderQuery systemFolderQuery,
            ProjectFacade projectFacade,
            ReaderQuery readerQuery,
            UserFacade userFacade) {
        this.reaches = reaches.stream().collect(Collectors.toMap(SystemReachSpi::kind, Function.identity()));
        this.systemFolderQuery = systemFolderQuery;
        this.projectFacade = projectFacade;
        this.readerQuery = readerQuery;
        this.userFacade = userFacade;
    }

    /** The system folders at 문서함's top, or a project's (its 회의록 only), with what the member sees in each. */
    @Transactional(readOnly = true)
    public List<SystemViews.SystemFolder> folders(CurrentUser user, UUID projectId) {
        var kinds = Stream.of(SystemKind.values())
                .filter(kind -> reaches.containsKey(kind) && (projectId == null || kind == SystemKind.MEETING))
                .toList();
        var summaries = kinds.stream()
                .map(kind ->
                        Map.entry(kind, systemFolderQuery.summarize(kind, reach(kind, user), user.id(), projectId)))
                .toList();
        var names = names(
                summaries.stream().map(entry -> entry.getValue().updatedBy()).toList());
        return summaries.stream()
                .map(entry -> new SystemViews.SystemFolder(
                        entry.getKey(),
                        entry.getValue().count(),
                        entry.getValue().updatedBy(),
                        nameOf(names, entry.getValue().updatedBy()),
                        entry.getValue().updatedAt()))
                .toList();
    }

    /** One page of a system folder, narrowed to a project and a facet when given, with its facets. */
    @Transactional(readOnly = true)
    public SystemViews.SystemSlice items(
            CurrentUser user, SystemKind kind, UUID projectId, UUID facetId, int offset, int size) {
        if (!reaches.containsKey(kind)) return new SystemViews.SystemSlice(List.of(), List.of(), null);
        var reach = reach(kind, user);
        var rows = systemFolderQuery.findPage(kind, reach, user.id(), projectId, facetId, offset, size + 1);
        var shown = rows.size() > size ? rows.subList(0, size) : rows;
        var counts = systemFolderQuery.countFacets(kind, reach, user.id(), projectId);
        var facetNames = facetNames(
                kind,
                Stream.concat(
                                shown.stream().map(SystemFolderQuery.Row::facetId),
                                counts.stream().map(SystemFolderQuery.FacetCount::facetId))
                        .filter(Objects::nonNull)
                        .distinct()
                        .toList());
        var people = names(shown.stream()
                .flatMap(row -> Stream.of(row.authorId(), row.updatedBy()))
                .toList());
        var items = shown.stream()
                .map(row -> new SystemViews.SystemItem(
                        row.id(),
                        row.title(),
                        row.facetId(),
                        row.facetId() == null ? null : facetNames.get(row.facetId()),
                        row.authorId(),
                        nameOf(people, row.authorId()),
                        row.updatedBy(),
                        nameOf(people, row.updatedBy()),
                        row.updatedAt()))
                .toList();
        var facets = new ArrayList<>(counts.stream()
                .map(count -> new SystemViews.SystemFacet(
                        count.facetId(), facetNames.getOrDefault(count.facetId(), "이름 없음"), count.count()))
                .toList());
        facets.sort(Comparator.comparing(SystemViews.SystemFacet::name));
        return new SystemViews.SystemSlice(items, facets, rows.size() > size ? offset + size : null);
    }

    private SystemReachSpi.Reach reach(SystemKind kind, CurrentUser user) {
        return reaches.get(kind).reachOf(user.id());
    }

    /** A facet's name: a meeting's project, a report's department. */
    private Map<UUID, String> facetNames(SystemKind kind, Collection<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        return switch (kind) {
            case MEETING ->
                projectFacade.summariesOf(ids).entrySet().stream()
                        .collect(Collectors.toMap(
                                Map.Entry::getKey, entry -> entry.getValue().name()));
            case WEEKLY_REPORT -> readerQuery.departmentNames(ids);
        };
    }

    private Map<UUID, UserSummary> names(Collection<UUID> ids) {
        var present = ids.stream().filter(Objects::nonNull).distinct().toList();
        return present.isEmpty() ? Map.of() : userFacade.summariesOf(present);
    }

    private static String nameOf(Map<UUID, UserSummary> names, UUID id) {
        var found = id == null ? null : names.get(id);
        return found == null ? null : found.name();
    }
}

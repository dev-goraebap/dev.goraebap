package xyz.goraebap.workspace.issue.application.board;

import java.time.Clock;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import xyz.goraebap.workspace.WorkspaceTransactional;
import xyz.goraebap.workspace.issue.application.IssueErrorCode;
import xyz.goraebap.workspace.issue.application.IssueProjects;
import xyz.goraebap.workspace.issue.domain.board.IssueColumn;
import xyz.goraebap.workspace.issue.domain.board.IssueColumnRepository;
import xyz.goraebap.workspace.issue.domain.issue.IssueRepository;
import xyz.goraebap.workspace.project.ProjectSummary;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/**
 * A project's board, BIT's columns: every project starts with 백로그, 할 일, 진행 중, 검토 중, 완료, 취소 (BoardSetup), and
 * Workspace administrators add, rename, reorder and remove columns. A column whose
 * meaning changes closes or opens the issues in it; one still holding issues cannot go, nor the last one.
 */
@Service
@RequiredArgsConstructor
public class BoardService {
    private final IssueColumnRepository issueColumnRepository;
    private final IssueRepository issueRepository;
    private final IssueProjects issueProjects;
    private final Clock clock;
    private final BoardQuery boardQuery;

    @WorkspaceTransactional(readOnly = true)
    public List<BoardViews.ColumnView> workspaceColumns() {
        return boardQuery.workspaceColumns();
    }

    @WorkspaceTransactional(readOnly = true)
    public List<BoardViews.ColumnView> columns(CurrentUser user, String key) {
        return columnsOf(issueProjects.readable(user, key));
    }

    /** The board of the project a key names whoever asks, for importers, which need no rights. */
    @WorkspaceTransactional(readOnly = true)
    public List<BoardViews.ColumnView> importedColumns(String key) {
        return columnsOf(issueProjects.live(key));
    }

    private List<BoardViews.ColumnView> columnsOf(ProjectSummary project) {
        return issueColumnRepository.findAllByProjectId(project.id()).stream()
                .map(BoardService::view)
                .toList();
    }

    @WorkspaceTransactional
    public UUID create(CurrentUser user, String key, BoardRequests.ColumnInput request) {
        var project = issueProjects.administered(user, key);
        var columns = issueColumnRepository.findAllByProjectId(project.id());
        var column =
                IssueColumn.create(UUID.randomUUID(), project.id(), request.name(), request.category(), columns.size());
        issueColumnRepository.saveAll(List.of(column), user.id(), clock.instant());
        issueProjects.signal(project);
        return column.id();
    }

    @WorkspaceTransactional
    public void edit(CurrentUser user, String key, UUID columnId, BoardRequests.ColumnInput request) {
        var project = issueProjects.administered(user, key);
        var column = columnOf(project.id(), columnId);
        boolean closed = column.category().closes();
        column.revise(request.name(), request.category());
        var now = clock.instant();
        issueColumnRepository.saveAll(List.of(column), user.id(), now);
        if (closed != column.category().closes())
            issueRepository.updateClosedByColumnId(
                    column.id(), column.category().closes(), now);
        issueProjects.signal(project);
    }

    /** Removes an empty column; the deleted issues still in it move to the first column left, the rest close up. */
    @WorkspaceTransactional
    public void delete(CurrentUser user, String key, UUID columnId) {
        var project = issueProjects.administered(user, key);
        var column = columnOf(project.id(), columnId);
        if (issueRepository.existsByColumnId(column.id())) throw IssueErrorCode.ISSUE_COLUMN_NOT_EMPTY.raise();
        var rest = new ArrayList<>(issueColumnRepository.findAllByProjectId(project.id()));
        rest.remove(column);
        if (rest.isEmpty()) throw IssueErrorCode.ISSUE_COLUMN_LAST.raise();
        issueRepository.updateColumnOfDeleted(column.id(), rest.getFirst().id());
        issueColumnRepository.deleteById(column.id());
        for (int index = 0; index < rest.size(); index++) rest.get(index).place(index);
        issueColumnRepository.saveAll(rest, user.id(), clock.instant());
        issueProjects.signal(project);
    }

    /** Puts every column of the project in the given order; the list must be exactly its columns. */
    @WorkspaceTransactional
    public void reorder(CurrentUser user, String key, BoardRequests.ColumnOrder request) {
        var project = issueProjects.administered(user, key);
        var columns = issueColumnRepository.findAllByProjectId(project.id()).stream()
                .collect(Collectors.toMap(IssueColumn::id, Function.identity()));
        if (request.ids().size() != columns.size() || !new HashSet<>(request.ids()).equals(columns.keySet()))
            throw IssueErrorCode.ISSUE_COLUMN_ORDER_MISMATCH.raise();
        var ordered = new ArrayList<IssueColumn>();
        for (int index = 0; index < request.ids().size(); index++) {
            var column = columns.get(request.ids().get(index));
            column.place(index);
            ordered.add(column);
        }
        issueColumnRepository.saveAll(ordered, user.id(), clock.instant());
        issueProjects.signal(project);
    }

    private IssueColumn columnOf(UUID projectId, UUID columnId) {
        return issueColumnRepository
                .findById(columnId)
                .filter(column -> column.projectId().equals(projectId))
                .orElseThrow(IssueErrorCode.ISSUE_COLUMN_NOT_FOUND::raise);
    }

    private static BoardViews.ColumnView view(IssueColumn column) {
        return new BoardViews.ColumnView(column.id(), column.name(), column.category(), column.position());
    }
}

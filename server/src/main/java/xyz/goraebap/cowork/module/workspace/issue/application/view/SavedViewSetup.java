package xyz.goraebap.cowork.module.workspace.issue.application.view;

import java.time.Clock;
import java.util.ArrayList;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import xyz.goraebap.cowork.module.workspace.issue.domain.board.ColumnCategory;
import xyz.goraebap.cowork.module.workspace.issue.domain.board.IssueColumnRepository;
import xyz.goraebap.cowork.module.workspace.issue.domain.view.SavedView;
import xyz.goraebap.cowork.module.workspace.issue.domain.view.SavedViewRepository;
import xyz.goraebap.cowork.module.workspace.project.ProjectSetupSpi;

/**
 * Gives a new project the shared views every project starts with (SavedView.starters), within the transaction that
 * made it, as V30 gave the projects there were then. They have no owner, so they stay when their maker leaves.
 */
@Component
@RequiredArgsConstructor
class SavedViewSetup implements ProjectSetupSpi {
    private final SavedViewRepository savedViewRepository;
    private final Clock clock;
    private final IssueColumnRepository issueColumnRepository;

    @Override
    public void projectCreated(UUID projectId, UUID actor) {
        var now = clock.instant();
        String backlog = issueColumnRepository.findAllByProjectId(projectId).stream()
                .filter(column -> column.category() == ColumnCategory.BACKLOG)
                .map(column -> column.id().toString())
                .collect(java.util.stream.Collectors.joining(","));
        var views = SavedView.starters(true, backlog).stream()
                .map(definition -> SavedView.create(UUID.randomUUID(), projectId, null, false, definition))
                .toList();
        savedViewRepository.saveAll(views, actor, now);
        // Made at the same moment, so their order is written down: 전체 이슈 first, then the starters as listed.
        var keys = new ArrayList<String>();
        keys.add(SavedView.ALL);
        views.forEach(view -> keys.add(view.id().toString()));
        savedViewRepository.saveOrder(projectId, keys, actor, now);
    }
}

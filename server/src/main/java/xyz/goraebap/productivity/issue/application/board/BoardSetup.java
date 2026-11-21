package xyz.goraebap.productivity.issue.application.board;

import java.time.Clock;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import xyz.goraebap.productivity.issue.domain.board.IssueColumn;
import xyz.goraebap.productivity.issue.domain.board.IssueColumnRepository;
import xyz.goraebap.productivity.project.ProjectSetupSpi;

/**
 * Gives a new project BIT's board within the transaction that made it. Kept apart from BoardService, which reads
 * projects through ProjectFacade, so making a project does not depend on itself.
 */
@org.springframework.core.annotation.Order(-10)
@Component
@RequiredArgsConstructor
class BoardSetup implements ProjectSetupSpi {
    private final IssueColumnRepository issueColumnRepository;
    private final Clock clock;

    @Override
    public void projectCreated(UUID projectId, UUID actor) {
        if (issueColumnRepository.findAllByProjectId(projectId).isEmpty())
            issueColumnRepository.saveAll(IssueColumn.defaults(projectId), actor, clock.instant());
    }
}

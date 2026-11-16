package xyz.goraebap.workspace.issue.domain.board;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IssueColumnRepository {
    /** The project's columns in the board's order. */
    List<IssueColumn> findAllByProjectId(UUID projectId);

    Optional<IssueColumn> findById(UUID id);

    void saveAll(List<IssueColumn> columns, UUID actor, Instant now);

    void deleteById(UUID id);
}

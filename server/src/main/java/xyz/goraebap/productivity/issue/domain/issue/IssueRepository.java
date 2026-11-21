package xyz.goraebap.productivity.issue.domain.issue;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface IssueRepository {
    /** The issue with its labels, deleted or not. */
    Optional<Issue> findById(UUID id);

    Optional<Issue> findByProjectIdAndNumber(UUID projectId, long number);

    /** The live issues of a cycle. */
    java.util.List<Issue> findAllByCycleId(UUID cycleId);

    /** The parent of the issue, if any, to walk up an issue's ancestors. */
    Optional<UUID> findParentIdById(UUID id);

    /** Whether a live issue sits in the column. */
    boolean existsByColumnId(UUID columnId);

    /** Closes the column's open issues, or opens its closed ones, when what the column means changed. */
    void updateClosedByColumnId(UUID columnId, boolean closes, Instant now);

    /** Moves the deleted issues still in a column to another, before the column goes. */
    void updateColumnOfDeleted(UUID fromColumnId, UUID toColumnId);

    /** The place of the first and last live issue in the column, the issue being moved left out. */
    Optional<Double> findFirstPositionByColumnId(UUID columnId, UUID excluding);

    Optional<Double> findLastPositionByColumnId(UUID columnId, UUID excluding);

    /** The place of the live issue right after the given place in the column, the issue being moved left out. */
    Optional<Double> findPositionAfter(UUID columnId, double position, UUID excluding);

    /**
     * Inserts the issue, or updates it over the version it was read at as the next version, its labels with it; false
     * when it changed since.
     */
    boolean save(Issue issue, UUID actor, Instant now);
}

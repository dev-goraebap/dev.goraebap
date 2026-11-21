package xyz.goraebap.productivity.issue.domain.label;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IssueLabelRepository {
    /** The workspace's labels in their order. */
    List<IssueLabel> findAll();

    Optional<IssueLabel> findById(UUID id);

    /** Whether another label has this name, whatever its case. */
    boolean existsByNameAndIdNot(String name, UUID id);

    int nextPosition();

    void save(IssueLabel label, UUID actor, Instant now);

    /** Puts the labels in this order, the first at 0; a label not named keeps its place after them. */
    void reorder(List<UUID> ids, UUID actor, Instant now);

    /** How many live issues carry the label. */
    int countUses(UUID id);

    /** Deletes the label and takes it off every issue. */
    void deleteById(UUID id);
}

package xyz.goraebap.module.workspace.issue.domain.type;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkItemTypeRepository {
    /** The workspace's types in their order. */
    List<WorkItemType> findAll();

    Optional<WorkItemType> findByCode(String code);

    /** Whether another type has this name, whatever its case. */
    boolean existsByNameAndCodeNot(String name, String code);

    int nextPosition();

    void save(WorkItemType type, UUID actor, Instant now);

    /** Makes the type the default, and no other. */
    void makeDefault(String code, UUID actor, Instant now);

    /** Puts the types in this order, the first at 0. */
    void reorder(List<String> codes, UUID actor, Instant now);

    /** How many issues, deleted ones too, keep the type. */
    int countUses(String code);

    void delete(String code);
}

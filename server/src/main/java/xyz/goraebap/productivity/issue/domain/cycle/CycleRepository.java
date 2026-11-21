package xyz.goraebap.productivity.issue.domain.cycle;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CycleRepository {
    /** A project's cycles, the earliest first. */
    List<Cycle> findAllByProjectId(UUID projectId);

    Optional<Cycle> findById(UUID id);

    /** Saves over the version read (false when another change came first); a new one is inserted. */
    boolean save(Cycle cycle, UUID actor, Instant now);

    void delete(UUID id);
}

package xyz.goraebap.workspace.document.domain.access;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface GrantRepository {
    /** What a grant is on. */
    enum Target {
        FOLDER,
        DOCUMENT
    }

    /** The grants of every closed folder or document of the given kind, by its id; an open one is not there. */
    Map<UUID, List<Grant>> findAllByTarget(Target target);

    /** The grants of one item; none, it is open. */
    List<Grant> findByTarget(Target target, UUID id);

    /** Puts the item's grants in place of what it had, by actor at now; none opens it. */
    void replace(Target target, UUID id, List<Grant> grants, UUID actor, Instant now);
}

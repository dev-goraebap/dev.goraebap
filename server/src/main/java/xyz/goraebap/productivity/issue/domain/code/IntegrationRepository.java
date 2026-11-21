package xyz.goraebap.productivity.issue.domain.code;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface IntegrationRepository {
    Optional<Integration> findById(UUID id);

    List<Integration> findAllByProjectId(UUID projectId);

    void save(Integration integration);

    void deleteById(UUID id);

    /** The project's rules: an event with a column, or with none (kept where it is); an event missing has no rule. */
    Map<RuleEvent, Optional<UUID>> findRules(UUID projectId);

    void saveRules(UUID projectId, Map<RuleEvent, Optional<UUID>> rules, UUID actor, Instant now);
}

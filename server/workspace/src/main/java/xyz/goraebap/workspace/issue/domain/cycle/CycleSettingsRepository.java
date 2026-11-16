package xyz.goraebap.workspace.issue.domain.cycle;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface CycleSettingsRepository {
    Optional<CycleSettings> find(UUID projectId);

    void save(CycleSettings settings, UUID actor, Instant now);
}

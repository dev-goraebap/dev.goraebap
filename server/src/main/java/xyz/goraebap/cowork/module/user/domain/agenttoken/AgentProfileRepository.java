package xyz.goraebap.cowork.module.user.domain.agenttoken;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface AgentProfileRepository {
    List<AgentProfile> findAllByUserId(UUID userId);

    Optional<AgentProfile> findById(UUID id);

    Map<UUID, String> namesOf(Collection<UUID> ids);

    void save(AgentProfile profile);
}

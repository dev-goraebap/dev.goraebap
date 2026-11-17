package xyz.goraebap.module.workspace.document.infrastructure;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import xyz.goraebap.module.workspace.document.DocumentGroupSpi;
import xyz.goraebap.module.workspace.document.application.access.ReaderQuery;

/** Asks the domain that keeps groups; where the assembly has none, a member is in no group and no group has a name. */
@Component
@RequiredArgsConstructor
class SpiReaderQuery implements ReaderQuery {
    private final Optional<DocumentGroupSpi> groups;

    @Override
    public Set<UUID> departmentsOf(UUID userId) {
        return groups.map(spi -> spi.groupsOf(userId)).orElse(Set.of());
    }

    @Override
    public Map<UUID, String> departmentNames(Collection<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        return groups.map(spi -> spi.namesOf(ids)).orElse(Map.of());
    }
}

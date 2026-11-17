package xyz.goraebap.module.workspace.document;

import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * The groups a document can be shared with besides projects (departments, teams), implemented by the domain that
 * keeps them. Without one, documents are shared with projects and people only.
 */
public interface DocumentGroupSpi {
    /** The groups the member is in, with every group above them; none when they have none. */
    Set<UUID> groupsOf(UUID userId);

    /** The names of the given groups, deleted ones too. */
    Map<UUID, String> namesOf(Collection<UUID> ids);
}

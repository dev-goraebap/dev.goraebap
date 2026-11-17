package xyz.goraebap.module.workspace.document.application.access;

import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * What 문서함's grants need to know of a member and of the subjects they name: read where the organization and the
 * projects keep it, as conditions of what a list shows.
 */
public interface ReaderQuery {
    /** The departments the member is in with every department above them; none when they have none. */
    Set<UUID> departmentsOf(UUID userId);

    /** The names of the given departments, deleted ones too. */
    Map<UUID, String> departmentNames(Collection<UUID> ids);
}

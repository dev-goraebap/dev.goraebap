package xyz.goraebap.foundation.user;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

/** What each member belongs to (a department, a team), by name, implemented by the domain that keeps it. */
public interface AffiliationSpi {
    /** Names for the given members who have one; the rest are left out. */
    Map<UUID, String> affiliationNamesOf(Collection<UUID> userIds);
}

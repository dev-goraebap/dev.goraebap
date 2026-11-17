package xyz.goraebap.module.workspace.document;

import java.util.Set;
import java.util.UUID;

/**
 * Who sees a system folder's documents, as the module that keeps them rules it (docs/pending-records.md, 문서함 ③): every
 * member, or those narrowed by the given facets (a lead's departments). A member always sees the ones they wrote. The
 * module implements it; 문서함 lists by it.
 */
public interface SystemReachSpi {
    SystemKind kind();

    /** How far the member sees this kind's documents. */
    Reach reachOf(UUID reader);

    /** Every member's documents, or those of the facets given. */
    record Reach(boolean everyone, Set<UUID> facets) {
        public static final Reach EVERYONE = new Reach(true, Set.of());

        public Reach {
            facets = Set.copyOf(facets);
        }
    }
}

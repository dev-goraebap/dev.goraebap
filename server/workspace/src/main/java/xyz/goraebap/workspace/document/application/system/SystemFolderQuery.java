package xyz.goraebap.workspace.document.application.system;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import xyz.goraebap.workspace.document.SystemKind;
import xyz.goraebap.workspace.document.SystemReachSpi.Reach;

/**
 * A system folder's documents as a member sees them: the kind's live rows within their reach (or their own), for one
 * project when one is given, for one facet when one is chosen; the rows carry no names.
 */
public interface SystemFolderQuery {
    /** One page of them, the latest changed first. */
    List<Row> findPage(SystemKind kind, Reach reach, UUID reader, UUID projectId, UUID facetId, int offset, int limit);

    /** How many each facet holds, the facets the member sees. */
    List<FacetCount> countFacets(SystemKind kind, Reach reach, UUID reader, UUID projectId);

    /** How many there are and the latest change, for the folder's row. */
    Summary summarize(SystemKind kind, Reach reach, UUID reader, UUID projectId);

    record Row(UUID id, String title, UUID facetId, UUID authorId, UUID updatedBy, Instant updatedAt) {}

    record FacetCount(UUID facetId, int count) {}

    record Summary(int count, UUID updatedBy, Instant updatedAt) {}
}

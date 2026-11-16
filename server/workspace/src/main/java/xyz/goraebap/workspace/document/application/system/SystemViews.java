package xyz.goraebap.workspace.document.application.system;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import xyz.goraebap.workspace.document.SystemKind;

public final class SystemViews {
    private SystemViews() {}

    /** A system folder's row in 문서함: its kind, how many documents the member sees in it, and the latest change. */
    @Schema(name = "DocumentBoxSystem")
    public record SystemFolder(SystemKind kind, int count, UUID updatedById, String updatedByName, Instant updatedAt) {}

    /** One of its documents: its title, its facet (a project, a department) and its writer, and when it last changed. */
    @Schema(name = "DocumentBoxSystemItem")
    public record SystemItem(
            UUID id,
            String title,
            UUID facetId,
            String facetName,
            UUID authorId,
            String authorName,
            UUID updatedById,
            String updatedByName,
            Instant updatedAt) {}

    /** A facet the folder narrows by, with how many documents the member sees in it. */
    @Schema(name = "DocumentBoxSystemFacet")
    public record SystemFacet(UUID id, String name, int count) {}

    /** One page of a system folder, its facets, and where the next page starts when there is one. */
    @Schema(name = "DocumentBoxSystemSlice")
    public record SystemSlice(List<SystemItem> items, List<SystemFacet> facets, Integer nextOffset) {
        public SystemSlice {
            items = List.copyOf(items);
            facets = List.copyOf(facets);
        }
    }
}

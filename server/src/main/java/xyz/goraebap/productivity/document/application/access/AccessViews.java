package xyz.goraebap.productivity.document.application.access;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import xyz.goraebap.productivity.document.domain.access.Grant;

public final class AccessViews {
    private AccessViews() {}

    /** One grant as the permission panel shows it: who (with a name to show) and how far. */
    @Schema(name = "DocumentGrantView")
    public record GrantView(Grant.Subject subject, UUID subjectId, String name, Grant.Level level) {}

    /** A closed folder above the item, from the top down, and its grants: what the item takes before its own. */
    @Schema(name = "DocumentInheritedAccess")
    public record Inherited(UUID folderId, String folderName, List<GrantView> grants) {
        public Inherited {
            grants = List.copyOf(grants);
        }
    }

    /**
     * A folder's or document's permissions: its own grants (none, it is open and takes what is above it), the closed
     * folders above it, how far the reader may go with it, and whether they may change its grants.
     */
    @Schema(name = "DocumentAccess")
    public record AccessView(List<GrantView> grants, List<Inherited> inherited, Grant.Level level, boolean canManage) {
        public AccessView {
            grants = List.copyOf(grants);
            inherited = List.copyOf(inherited);
        }
    }

    /** One grant asked for: the item's maker (OWNER, no id), a member or a project, and how far. */
    @Schema(name = "DocumentGrantInput")
    public record GrantInput(
            @NotNull Grant.Subject subject,
            UUID subjectId,
            @NotNull Grant.Level level) {}

    /** The item's grants in place of what it had; none opens it. */
    @Schema(name = "ReplaceDocumentGrants")
    public record ReplaceGrants(@NotNull @Size(max = 100) List<@Valid @NotNull GrantInput> grants) {
        public ReplaceGrants {
            grants = grants == null ? null : List.copyOf(grants);
        }
    }
}

package xyz.goraebap.workspace.issue.application.type;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import xyz.goraebap.workspace.issue.domain.type.WorkItemType;

public final class TypeRequests {
    private TypeRequests() {}

    /** A type's name and mark (a Solar icon name, a #RRGGBB colour), and whether it becomes the default. */
    public record TypeInput(
            @NotBlank @Size(max = WorkItemType.NAME_MAX) String name,
            @NotBlank @Size(max = WorkItemType.ICON_MAX) String icon,

            @NotBlank @Pattern(regexp = WorkItemType.COLOR_PATTERN) String color,

            boolean isDefault) {}

    /** Every type, by code, in its new order. */
    @Schema(name = "WorkItemTypeOrder")
    public record Order(@NotNull @Size(max = 100) List<@NotBlank String> codes) {
        public Order {
            codes = codes == null ? List.of() : List.copyOf(codes);
        }
    }
}

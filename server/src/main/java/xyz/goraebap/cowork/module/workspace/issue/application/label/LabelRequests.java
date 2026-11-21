package xyz.goraebap.cowork.module.workspace.issue.application.label;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import xyz.goraebap.cowork.module.workspace.issue.domain.label.IssueLabel;

public final class LabelRequests {
    private LabelRequests() {}

    /** A label's name and #RRGGBB colour. */
    public record LabelInput(
            @NotBlank @Size(max = IssueLabel.NAME_MAX) String name,

            @NotBlank @Pattern(regexp = IssueLabel.COLOR_PATTERN) String color) {}

    /** Every label in its new order. */
    @Schema(name = "IssueLabelOrder")
    public record Order(@NotNull @Size(max = 500) List<@NotNull UUID> ids) {
        public Order {
            ids = ids == null ? List.of() : List.copyOf(ids);
        }
    }
}

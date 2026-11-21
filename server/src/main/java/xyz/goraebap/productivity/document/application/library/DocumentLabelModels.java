package xyz.goraebap.productivity.document.application.library;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public final class DocumentLabelModels {
    private DocumentLabelModels() {}

    @Schema(name = "DocumentLabelView")
    public record LabelView(UUID id, String name, String color, int position, long version, int uses) {}

    @Schema(name = "DocumentLabelInput")
    public record Input(
            @NotBlank @Size(max = 200) String name,
            @NotBlank @Pattern(regexp = "#[0-9a-fA-F]{6}") String color) {}

    @Schema(name = "EditDocumentLabel")
    public record Edit(
            @NotNull Long expectedVersion,
            @NotBlank @Size(max = 200) String name,
            @NotBlank @Pattern(regexp = "#[0-9a-fA-F]{6}") String color) {}

    @Schema(name = "DocumentLabelOrder")
    public record Order(@NotNull List<UUID> ids) {
        public Order {
            ids = ids == null ? null : List.copyOf(ids);
        }
    }
}

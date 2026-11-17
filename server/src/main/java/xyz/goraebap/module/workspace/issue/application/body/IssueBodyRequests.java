package xyz.goraebap.module.workspace.issue.application.body;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import xyz.goraebap.module.workspace.richbody.RichBodyEdit;

public final class IssueBodyRequests {
    private IssueBodyRequests() {}

    /**
     * One save of the issue's body (RichBody's save): over the version the last answer gave, the editor's body (Tiptap
     * JSON, schemaVersion 1), the uploads it names for the first time, and whether to keep it as a version.
     */
    @Schema(name = "IssueBodySave")
    public record Save(
            @NotNull @Min(0) Long expectedVersion,
            @NotNull Map<String, Object> body,
            @Size(max = 20) List<@NotNull UUID> uploadIds,
            boolean checkpoint,
            @Min(1) @Max(1) Integer schemaVersion) {
        public Save {
            body = body == null ? null : Map.copyOf(present(body));
            uploadIds = uploadIds == null ? List.of() : List.copyOf(uploadIds);
        }

        RichBodyEdit edit() {
            return new RichBodyEdit(expectedVersion, body, uploadIds, checkpoint);
        }
    }

    /** Making a kept version the body again, over the version read. */
    @Schema(name = "IssueBodyRestore")
    public record Restore(@NotNull @Min(0) Long expectedVersion) {}

    /** A JSON object without the keys whose value is null, as JSON reads a missing key (Map.copyOf takes no nulls). */
    private static Map<String, Object> present(Map<String, Object> object) {
        var present = new LinkedHashMap<String, Object>();
        object.forEach((key, value) -> {
            if (key != null && value != null) present.put(key, value);
        });
        return present;
    }
}

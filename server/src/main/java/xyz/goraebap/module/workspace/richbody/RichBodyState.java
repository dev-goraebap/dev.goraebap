package xyz.goraebap.module.workspace.richbody;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * A body as the editor reads it: the version a save goes over, the body (none when never written), the kept versions
 * (newest first) and the address of each file the body names. The discussion is the owner's timeline (the common
 * activity), not the body's.
 */
@Schema(requiredProperties = {"version", "body", "blocks", "versions", "files", "schemaVersion"})
public record RichBodyState(
        long version,
        @Schema(nullable = true) Map<String, Object> body,
        /** Each top-level block's version (the body version that last changed it): a save of blocks goes over these. */
        Map<String, Long> blocks,
        List<BodyVersion> versions,
        Map<UUID, String> files,
        int schemaVersion) {
    /** The body editor's document schema these bodies are written in. */
    public static final int SCHEMA_VERSION = 1;

    public RichBodyState {
        body = body == null ? null : Map.copyOf(RichBodyJson.present(body));
        blocks = blocks == null ? Map.of() : Map.copyOf(blocks);
        versions = List.copyOf(versions);
        files = Map.copyOf(files);
    }

    /**
     * A kept version: why it was kept (baseline, automatic, before-restore, restored) and that in words, when, and its body
     * only when one version is read (the body's list leaves it out).
     */
    @Schema(
            name = "RichBodyVersion",
            requiredProperties = {"id", "reason", "label", "created", "body"})
    public record BodyVersion(
            UUID id,
            String reason,
            String label,
            Instant created,
            @Schema(nullable = true) Map<String, Object> body) {
        public BodyVersion {
            body = body == null ? null : Map.copyOf(RichBodyJson.present(body));
        }
    }
}

package xyz.goraebap.productivity.richbody;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * One save of a body's blocks (the body saved as its changed top-level blocks, not as a whole): the order of the
 * blocks as the editor has them, each block written (its node, and the block version read: none for a
 * new block) and each block deleted (with the version read), the root attributes when they changed, the uploads the
 * body names for the first time and whether to keep the body as a version. A block changed elsewhere since it was read
 * refuses the save (RICH_BODY_BLOCK_CONFLICT); blocks changed elsewhere that this save does not touch are kept.
 */
@Schema(requiredProperties = {"order", "puts", "deletes", "uploadIds", "checkpoint"})
public record RichBodyPatch(
        List<String> order,
        List<Put> puts,
        List<Delete> deletes,
        @Schema(nullable = true) Map<String, Object> attrs,
        List<UUID> uploadIds,
        boolean checkpoint) {
    public RichBodyPatch {
        order = order == null ? List.of() : List.copyOf(order);
        puts = puts == null ? List.of() : List.copyOf(puts);
        deletes = deletes == null ? List.of() : List.copyOf(deletes);
        uploadIds = uploadIds == null ? List.of() : List.copyOf(uploadIds);
        attrs = attrs == null ? null : Map.copyOf(RichBodyJson.present(attrs));
    }

    /** A block written: its id, node and the block version read (null for a block new to the body). */
    @Schema(
            name = "RichBodyPut",
            requiredProperties = {"blockId", "node"})
    public record Put(
            String blockId,
            Map<String, Object> node,
            @Schema(nullable = true) Long expectedVersion) {
        public Put {
            node = node == null ? null : Map.copyOf(RichBodyJson.present(node));
        }
    }

    /** A block deleted, over the block version read. */
    @Schema(
            name = "RichBodyDelete",
            requiredProperties = {"blockId", "expectedVersion"})
    public record Delete(String blockId, long expectedVersion) {}
}

package xyz.goraebap.cowork.module.workspace.richbody.domain;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * A body's top-level blocks, the source of the body (rich_body.body is their assembly, written with them): each block
 * its node as JSON text, its place in the body (an order key) and the body version that last changed it. Every change
 * of blocks is logged by the body version that made it.
 */
public interface RichBlockRepository {
    /** The body's blocks in order. */
    List<Block> blocks(UUID ownerId);

    /** Writes the blocks (new or changed: node, place or both) at the given body version. */
    void put(UUID ownerId, Collection<Block> blocks, UUID actor, Instant now);

    void delete(UUID ownerId, Collection<String> blockIds);

    /** Logs what one body version did to blocks: a block's node (written or moved), or null for one deleted. */
    void log(UUID ownerId, long version, Collection<Change> changes, UUID actor, Instant now);

    /** The blocks written, moved or deleted by body versions after the one given. */
    java.util.Set<String> changedSince(UUID ownerId, long version);

    /** The body's root attributes (page setup and the like) as JSON text, null when it has none. */
    String attrs(UUID ownerId);

    void saveAttrs(UUID ownerId, String attrs);

    /** A block: its id (the node's blockId), order key, node JSON and the body version that last changed it. */
    record Block(String id, String position, String node, long version) {}

    /** A block a body version changed: its node after, or null when it was deleted. */
    record Change(String blockId, String node) {}
}

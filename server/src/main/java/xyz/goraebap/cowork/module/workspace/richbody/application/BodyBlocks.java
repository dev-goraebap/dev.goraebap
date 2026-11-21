package xyz.goraebap.cowork.module.workspace.richbody.application;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * A body (Tiptap JSON) as its top-level blocks, and back: each block a node with a blockId unique in the body (one
 * missing or repeated takes a new id), and the root's attributes apart. The body text is assembled from the blocks'
 * JSON in order, in the same key order a body is always written in, so the assembly is the body as it would be written.
 */
final class BodyBlocks {
    /** The longest block id. */
    static final int ID_MAX = 64;

    private BodyBlocks() {}

    /** A body split: its root attributes (null for none) and its blocks in order, each with its id. */
    record Split(Map<String, Object> attrs, List<Block> blocks) {}

    record Block(String id, Map<String, Object> node) {}

    static Split split(Map<String, Object> body) {
        var seen = new HashSet<String>();
        var blocks = new ArrayList<Block>();
        if (body.get("content") instanceof List<?> content) {
            for (Object item : content) {
                if (!(item instanceof Map<?, ?> map)) continue;
                var node = copy(map);
                var attrs = node.get("attrs") instanceof Map<?, ?> found
                        ? copy(found)
                        : new LinkedHashMap<String, Object>();
                String id = attrs.get("blockId") instanceof String given ? given : "";
                if (id.isBlank() || id.length() > ID_MAX || !seen.add(id)) {
                    id = UUID.randomUUID().toString();
                    seen.add(id);
                }
                attrs.put("blockId", id);
                node.put("attrs", attrs);
                blocks.add(new Block(id, node));
            }
        }
        Map<String, Object> attrs = body.get("attrs") instanceof Map<?, ?> root && !root.isEmpty() ? copy(root) : null;
        return new Split(attrs, blocks);
    }

    /** The body text from the root attributes (JSON or null) and the blocks' JSON in order. */
    static String assemble(String attrs, List<String> nodes) {
        var text = new StringBuilder(nodes.stream().mapToInt(String::length).sum() + 64).append('{');
        if (attrs != null) text.append("\"attrs\":").append(attrs).append(',');
        text.append("\"content\":[");
        for (int index = 0; index < nodes.size(); index++) {
            if (index > 0) text.append(',');
            text.append(nodes.get(index));
        }
        return text.append("],\"type\":\"doc\"}").toString();
    }

    /** A block's node with the given id as its blockId. */
    static Map<String, Object> withId(Map<String, Object> node, String id) {
        var copy = copy(node);
        var attrs = copy.get("attrs") instanceof Map<?, ?> found ? copy(found) : new LinkedHashMap<String, Object>();
        attrs.put("blockId", id);
        copy.put("attrs", attrs);
        return copy;
    }

    private static Map<String, Object> copy(Map<?, ?> map) {
        var copy = new LinkedHashMap<String, Object>();
        map.forEach((key, value) -> copy.put(String.valueOf(key), value));
        return copy;
    }
}

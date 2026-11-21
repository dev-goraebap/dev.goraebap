package xyz.goraebap.productivity.richbody.application;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import xyz.goraebap.productivity.richbody.RichBodyMarkdown;

/** Restores only blocks from the current owner, and refuses omissions before any body or attachment is saved. */
final class MarkdownReplacement {
    private MarkdownReplacement() {}

    /** 문서 루트에 두는 설정: 인쇄 시작(옛 형식)과 페이지 설정(용지·여백·머리말·바닥글). */
    private static final List<String> DOCUMENT_ATTRS = List.of("printStartOnNewPage", "pageSetup");

    static Map<String, Object> restore(Map<String, Object> next, Map<String, Object> current, List<String> dropBlocks) {
        var kept = new LinkedHashMap<String, List<Map<String, Object>>>();
        var media = new LinkedHashMap<String, List<Map<String, Object>>>();
        if (current != null) collect(current, kept, media);
        Set<String> drops = Set.copyOf(dropBlocks);
        for (String id : drops)
            if (!kept.containsKey(id)) throw RichBodyErrorCode.RICH_BODY_INVALID.raise("삭제할 보존 블록을 찾을 수 없습니다: " + id);
        var restored = walk(next, kept, media, drops);
        // Markdown에는 문서 자체의 설정(인쇄 속성, 페이지 설정)이 없으므로 현재 문서의 설정을 유지한다.
        if (current != null) {
            var documentAttrs = new LinkedHashMap<>(attrs(restored));
            for (String key : DOCUMENT_ATTRS)
                if (attrs(current).get(key) != null)
                    documentAttrs.put(key, attrs(current).get(key));
            if (!documentAttrs.isEmpty()) restored.put("attrs", documentAttrs);
        }
        var missing = new ArrayList<String>();
        kept.forEach((id, nodes) -> {
            if (!drops.contains(id) && !nodes.isEmpty()) {
                var node = nodes.getFirst();
                missing.add(id + " (" + node.get("type") + ": " + preview(node) + ")");
            }
        });
        if (!missing.isEmpty())
            throw RichBodyErrorCode.RICH_BODY_BLOCKS_MISSING.raise(
                    "보존 표시가 빠졌습니다: " + String.join(", ", missing) + ". 표시를 되돌리거나 drop_blocks에 삭제할 id를 명시하세요.");
        return restored;
    }

    private static void collect(
            Map<String, Object> node,
            Map<String, List<Map<String, Object>>> kept,
            Map<String, List<Map<String, Object>>> media) {
        if (!"doc".equals(node.get("type")) && RichBodyMarkdown.needsPreservation(node)) {
            kept.computeIfAbsent(RichBodyMarkdown.blockId(node), key -> new ArrayList<>())
                    .add(node);
            return;
        }
        if ("media".equals(node.get("type")))
            media.computeIfAbsent(source(node), key -> new ArrayList<>()).add(node);
        for (var child : children(node)) {
            // Structural and inline nodes are not independently exported blocks.
            if (Set.of("text", "hardBreak").contains(String.valueOf(child.get("type")))) continue;
            if (Set.of("listItem", "taskItem", "tableRow", "tableCell", "tableHeader")
                    .contains(String.valueOf(child.get("type")))) {
                for (var inner : children(child)) collectStructural(inner, kept, media);
            } else collect(child, kept, media);
        }
    }

    private static void collectStructural(
            Map<String, Object> node,
            Map<String, List<Map<String, Object>>> kept,
            Map<String, List<Map<String, Object>>> media) {
        if (Set.of("tableRow", "tableCell", "tableHeader", "listItem", "taskItem")
                .contains(String.valueOf(node.get("type"))))
            for (var child : children(node)) collectStructural(child, kept, media);
        else collect(node, kept, media);
    }

    private static Map<String, Object> walk(
            Map<String, Object> node,
            Map<String, List<Map<String, Object>>> kept,
            Map<String, List<Map<String, Object>>> media,
            Set<String> drops) {
        if ("preservedBlock".equals(node.get("type"))) {
            String id = String.valueOf(attrs(node).get("blockId"));
            var matches = kept.get(id);
            if (matches == null || matches.isEmpty() || drops.contains(id))
                throw RichBodyErrorCode.RICH_BODY_INVALID.raise("알 수 없거나 중복되거나 삭제 대상으로 지정한 보존 표시입니다: " + id);
            return matches.removeFirst();
        }
        var copy = new LinkedHashMap<>(node);
        if ("media".equals(node.get("type"))) {
            var matches = media.get(source(node));
            if (matches != null && !matches.isEmpty()) {
                var merged = new LinkedHashMap<>(attrs(matches.removeFirst()));
                Object name = attrs(node).get("name");
                if (name instanceof String text && !text.isBlank()) merged.put("name", name);
                copy.put("attrs", merged);
            }
        }
        if (node.containsKey("content"))
            copy.put(
                    "content",
                    children(node).stream()
                            .map(child -> walk(child, kept, media, drops))
                            .toList());
        return copy;
    }

    private static String preview(Map<String, Object> node) {
        String text = node.containsKey("text")
                ? String.valueOf(node.get("text"))
                : children(node).stream()
                        .map(MarkdownReplacement::preview)
                        .collect(java.util.stream.Collectors.joining(" "));
        return text.substring(0, Math.min(80, text.length()));
    }

    private static String source(Map<String, Object> node) {
        return String.valueOf(attrs(node).get("src"));
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> attrs(Map<String, Object> node) {
        return node.get("attrs") instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    @SuppressWarnings("unchecked")
    static List<Map<String, Object>> children(Map<String, Object> node) {
        return node.get("content") instanceof List<?> list ? (List<Map<String, Object>>) list : List.of();
    }
}

package xyz.goraebap.cowork.module.workspace.richbody;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * A body of the shared body editor (Tiptap JSON, schemaVersion 1) as Markdown, for agents that read it through the MCP
 * server (cowork-guide-agent-access); RichBodyFacade.fromMarkdown is the way back. Headings, paragraphs, bullet,
 * numbered and task lists, code (mermaid as a mermaid fence, math as a math fence), quotes, rules and tables come out as
 * CommonMark with GFM; bold, italic, strike, code and links inline, and a line break as a backslash at the line's end.
 * A callout comes out as a GFM alert, toggles as details/summary, and attachments as images or file links.
 * Blocks with no lossless Markdown representation use an opaque block marker, restored from the current owner on write.
 */
public final class RichBodyMarkdown {
    private static final tools.jackson.databind.json.JsonMapper CANONICAL =
            tools.jackson.databind.json.JsonMapper.builder().build();
    private final boolean preserve;

    private RichBodyMarkdown(boolean preserve) {
        this.preserve = preserve;
    }

    /** The document as Markdown; null or an empty document gives empty text. */
    public static String toMarkdown(Map<String, Object> doc) {
        if (doc == null) return "";
        return new RichBodyMarkdown(true).joinBlocks(children(doc), "\n\n").strip();
    }

    /**
     * Where each top-level block starts in {@link #toMarkdown}'s text, -1 for a block that writes nothing: a part of
     * that text (a section) maps back to the blocks that wrote it.
     */
    public static List<Integer> blockStarts(Map<String, Object> doc) {
        if (doc == null) return List.of();
        var writer = new RichBodyMarkdown(true);
        var starts = new ArrayList<Integer>();
        var text = new StringBuilder();
        for (var node : children(doc)) {
            String block = writer.block(node);
            if (block.isBlank()) {
                starts.add(-1);
                continue;
            }
            if (!text.isEmpty()) text.append("\n\n");
            starts.add(text.length());
            text.append(block);
        }
        int lead = text.length() - text.toString().stripLeading().length();
        return starts.stream()
                .map(start -> start < 0 ? -1 : Math.max(0, start - lead))
                .toList();
    }

    /** Markdown-only office drafts have no JSON owner from which opaque blocks could be restored. */
    public static String toDraftMarkdown(Map<String, Object> doc) {
        return doc == null
                ? ""
                : new RichBodyMarkdown(false).joinBlocks(children(doc), "\n\n").strip();
    }

    private String joinBlocks(List<Map<String, Object>> nodes, String separator) {
        var parts = new ArrayList<String>();
        for (var node : nodes) {
            String block = block(node);
            if (!block.isBlank()) parts.add(block);
        }
        return String.join(separator, parts);
    }

    private String block(Map<String, Object> node) {
        if (preserve && needsPreservation(node)) return "<!-- block:" + blockId(node) + " -->";
        String type = Objects.toString(node.get("type"), "");
        return switch (type) {
            case "paragraph", "toggleSummary" -> inlines(children(node));
            case "toggleBody" -> joinBlocks(children(node), "\n\n");
            case "heading" ->
                "#".repeat(Math.clamp(number(attr(node, "level"), 1), 1, 6)) + " " + inlines(children(node));
            case "blockquote" -> prefixed(joinBlocks(children(node), "\n\n"), "> ");
            case "callout" -> prefixed(alert(attr(node, "tone")) + "\n" + joinBlocks(children(node), "\n\n"), "> ");
            case "bulletList", "orderedList", "taskList" -> list(node, type);
            case "codeBlock" -> fenced(Objects.toString(attr(node, "language"), ""), plainText(children(node)));
            case "mermaidBlock" -> fenced("mermaid", Objects.toString(attr(node, "source"), ""));
            case "mathBlock" -> fenced("math", Objects.toString(attr(node, "source"), ""));
            case "webEmbed" -> {
                String source = Objects.toString(attr(node, "source"), "");
                yield source.isBlank() ? "" : "<" + source + ">";
            }
            case "horizontalRule" -> "---";
            case "table" -> table(node);
            case "toggle" -> {
                String summary = "", body = "";
                for (var child : children(node)) {
                    if ("toggleSummary".equals(child.get("type"))) summary = block(child);
                    else body = block(child);
                }
                yield "<details" + (Boolean.TRUE.equals(attr(node, "open")) ? " open" : "") + ">\n<summary>" + summary
                        + "</summary>\n\n" + body + "\n\n</details>";
            }
            case "media" -> {
                String name = Objects.toString(attr(node, "name"), "첨부 파일");
                String source = Objects.toString(attr(node, "src"), "");
                String mime = Objects.toString(attr(node, "mime"), "");
                yield (mime.startsWith("image/") ? "!" : "") + "[" + escape(name) + "](" + source + ")";
            }
            default -> node.containsKey("text") ? inlines(List.of(node)) : joinBlocks(children(node), "\n\n");
        };
    }

    /** A legacy block without an editor identity is addressed by its contents, never by its position. */
    public static String blockId(Map<String, Object> node) {
        Object id = attr(node, "blockId");
        if (id instanceof String text && text.matches("[A-Za-z0-9_-]+")) return text;
        String canonical = CANONICAL
                .writer()
                .with(tools.jackson.databind.SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS)
                .writeValueAsString(node);
        return "legacy-"
                + java.util.UUID.nameUUIDFromBytes(canonical.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    /** Layout, unsupported inline nodes/marks and attributes are kept verbatim rather than silently flattened. */
    public static boolean needsPreservation(Map<String, Object> node) {
        String type = Objects.toString(node.get("type"), "");
        if (!java.util.Set.of(
                        "paragraph",
                        "heading",
                        "blockquote",
                        "callout",
                        "bulletList",
                        "orderedList",
                        "taskList",
                        "codeBlock",
                        "mermaidBlock",
                        "mathBlock",
                        "webEmbed",
                        "horizontalRule",
                        "table",
                        "toggle",
                        "toggleSummary",
                        "toggleBody",
                        "media")
                .contains(type)) return true;
        if ("callout".equals(type)
                && !java.util.Set.of("info", "tip", "warning", "danger")
                        .contains(Objects.toString(attr(node, "tone"), "gray"))) return true;
        if ("media".equals(type))
            return !Objects.toString(attr(node, "src"), "").startsWith("attachment:");
        if ("table".equals(type)) {
            var rows = children(node);
            if (rows.isEmpty()) return true;
            int columns = children(rows.getFirst()).size();
            for (int row = 0; row < rows.size(); row++) {
                if (children(rows.get(row)).size() != columns) return true;
                for (var cell : children(rows.get(row))) {
                    if (!(row == 0 ? "tableHeader" : "tableCell").equals(cell.get("type"))) return true;
                    if (children(cell).size() != 1
                            || !"paragraph".equals(children(cell).getFirst().get("type"))) return true;
                    if (children(children(cell).getFirst()).stream().anyMatch(n -> "hardBreak".equals(n.get("type"))))
                        return true;
                }
            }
        }
        return lossy(node);
    }

    private static boolean lossy(Map<String, Object> node) {
        String type = Objects.toString(node.get("type"), "");
        var allowed =
                switch (type) {
                    case "heading" -> java.util.Set.of("blockId", "level");
                    case "callout" -> java.util.Set.of("blockId", "tone");
                    case "orderedList" -> java.util.Set.of("blockId", "start");
                    case "taskItem" -> java.util.Set.of("checked");
                    case "codeBlock" -> java.util.Set.of("blockId", "language");
                    case "mathBlock", "mermaidBlock", "webEmbed" -> java.util.Set.of("blockId", "source");
                    case "toggle" -> java.util.Set.of("blockId", "open");
                    default -> java.util.Set.of("blockId");
                };
        if (node.get("attrs") instanceof Map<?, ?> attrs)
            for (var entry : attrs.entrySet()) {
                if (entry.getValue() == null || allowed.contains(entry.getKey())) continue;
                if ("textAlign".equals(entry.getKey()) && "left".equals(entry.getValue())) continue;
                if (java.util.Set.of("colspan", "rowspan").contains(entry.getKey())
                        && Integer.valueOf(1).equals(entry.getValue())) continue;
                return true;
            }
        if (node.get("marks") instanceof List<?> marks)
            for (var mark : marks) {
                if (!(mark instanceof Map<?, ?> map)
                        || !java.util.Set.of("bold", "italic", "strike", "code", "link", "highlight", "textStyle")
                                .contains(map.get("type"))) return true;
                if ("textStyle".equals(map.get("type"))
                        && map.get("attrs") instanceof Map<?, ?> attrs
                        && attrs.entrySet().stream().anyMatch(e -> !"color".equals(e.getKey()) && e.getValue() != null))
                    return true;
            }
        for (var child : children(node)) {
            String childType = Objects.toString(child.get("type"), "");
            if (java.util.Set.of(
                            "text",
                            "hardBreak",
                            "tableRow",
                            "tableCell",
                            "tableHeader",
                            "listItem",
                            "taskItem",
                            "toggleSummary")
                    .contains(childType)) {
                if (lossy(child)) return true;
            } else if (!java.util.Set.of(
                            "paragraph",
                            "heading",
                            "blockquote",
                            "callout",
                            "bulletList",
                            "orderedList",
                            "taskList",
                            "codeBlock",
                            "mermaidBlock",
                            "mathBlock",
                            "webEmbed",
                            "horizontalRule",
                            "table",
                            "toggle",
                            "toggleBody",
                            "media",
                            "columns")
                    .contains(childType)) return true;
            else if (needsPreservation(child)) return true;
        }
        return false;
    }

    private String list(Map<String, Object> node, String type) {
        int number = number(attr(node, "start"), 1);
        var items = new ArrayList<String>();
        for (var item : children(node)) {
            String marker =
                    switch (type) {
                        case "orderedList" -> (number++) + ". ";
                        case "taskList" -> Boolean.TRUE.equals(attr(item, "checked")) ? "- [x] " : "- [ ] ";
                        default -> "- ";
                    };
            String body = joinBlocks(children(item), "\n");
            String indent = " ".repeat("taskList".equals(type) ? 2 : marker.length());
            items.add(marker + body.replace("\n", "\n" + indent).replaceAll("(?m)^[ \\t]+$", ""));
        }
        return String.join("\n", items);
    }

    private String table(Map<String, Object> node) {
        var lines = new ArrayList<String>();
        for (var row : children(node)) {
            var cells = new ArrayList<String>();
            for (var cell : children(row))
                cells.add(joinBlocks(children(cell), " ").replace("\n", " ").replace("|", "\\|"));
            lines.add("| " + String.join(" | ", cells) + " |");
            if (lines.size() == 1) lines.add("|" + " --- |".repeat(Math.max(1, cells.size())));
        }
        return String.join("\n", lines);
    }

    private static String inlines(List<Map<String, Object>> nodes) {
        var out = new StringBuilder();
        for (var node : nodes) {
            String type = Objects.toString(node.get("type"), "");
            if (type.equals("hardBreak")) out.append("\\\n");
            else if (type.equals("inlineMath"))
                out.append('$').append(attr(node, "source")).append('$');
            else if (type.equals("text")) out.append(marked(Objects.toString(node.get("text"), ""), node));
            else out.append(inlines(children(node)));
        }
        return out.toString();
    }

    private static String marked(String value, Map<String, Object> node) {
        String text = value;
        boolean code = false;
        String href = null;
        var wraps = new ArrayList<String>();
        // 글자색·형광펜은 마크다운에 없어 HTML 태그로 남긴다(BodyColors): 굵게·기울임 바깥을 감싼다.
        var colorOpen = new StringBuilder();
        var colorClose = new StringBuilder();
        if (node.get("marks") instanceof List<?> marks)
            for (var each : marks)
                if (each instanceof Map<?, ?> mark)
                    switch (Objects.toString(mark.get("type"), "")) {
                        case "code" -> code = true;
                        case "bold" -> wraps.add("**");
                        case "italic" -> wraps.add("*");
                        case "strike" -> wraps.add("~~");
                        case "link" ->
                            href = mark.get("attrs") instanceof Map<?, ?> attrs
                                    ? Objects.toString(attrs.get("href"), null)
                                    : null;
                        case "highlight", "textStyle" -> {
                            String type = Objects.toString(mark.get("type"), "");
                            Object color = mark.get("attrs") instanceof Map<?, ?> attrs ? attrs.get("color") : null;
                            BodyColors.openTag(type, color).ifPresent(tag -> {
                                colorOpen.append(tag);
                                colorClose.insert(0, BodyColors.closeTag(type));
                            });
                        }
                        default -> {}
                    }
        if (code) text = text.contains("`") ? "`` " + text + " ``" : "`" + text + "`";
        else text = escape(text);
        // Marks wrap outwards in the order they come: the first mark is innermost.
        var open = new StringBuilder();
        var close = new StringBuilder();
        for (String wrap : wraps) {
            open.insert(0, wrap);
            close.append(wrap);
        }
        text = colorOpen + open.toString() + text + close + colorClose;
        return href == null ? text : "[" + text + "](" + href + ")";
    }

    private static String escape(String text) {
        var out = new StringBuilder();
        for (char c : text.toCharArray()) {
            if (c == '\\' || c == '*' || c == '`' || c == '[' || c == ']') out.append('\\');
            out.append(c);
        }
        return out.toString();
    }

    /** A callout's tone as the GFM alert that fromMarkdown reads back into the same tone. */
    private static String alert(Object tone) {
        return switch (Objects.toString(tone, "")) {
            case "tip" -> "[!TIP]";
            case "warning" -> "[!WARNING]";
            case "danger" -> "[!CAUTION]";
            default -> "[!NOTE]";
        };
    }

    private static String fenced(String language, String code) {
        String fence = code.contains("```") ? "~~~" : "```";
        return fence + language + "\n" + code + "\n" + fence;
    }

    private static String prefixed(String text, String prefix) {
        if (text.isEmpty()) return prefix.strip();
        return text.lines()
                .map(line -> line.isEmpty() ? prefix.strip() : prefix + line)
                .collect(Collectors.joining("\n"));
    }

    private static String plainText(List<Map<String, Object>> nodes) {
        var out = new StringBuilder();
        for (var node : nodes) {
            if ("hardBreak".equals(node.get("type"))) out.append('\n');
            else if (node.containsKey("text")) out.append(node.get("text"));
            else out.append(plainText(children(node)));
        }
        return out.toString();
    }

    @SuppressWarnings("unchecked") // Tiptap JSON is maps and lists all the way down, as Jackson reads it.
    private static List<Map<String, Object>> children(Map<String, Object> node) {
        if (!(node.get("content") instanceof List<?> content)) return List.of();
        var out = new ArrayList<Map<String, Object>>();
        for (var child : content) if (child instanceof Map<?, ?> map) out.add((Map<String, Object>) map);
        return out;
    }

    private static Object attr(Map<String, Object> node, String name) {
        return node.get("attrs") instanceof Map<?, ?> attrs ? attrs.get(name) : null;
    }

    private static int number(Object value, int fallback) {
        return value instanceof Number number ? number.intValue() : fallback;
    }
}

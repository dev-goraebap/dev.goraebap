package xyz.goraebap.workspace.richbody.application;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;
import org.commonmark.ext.gfm.strikethrough.Strikethrough;
import org.commonmark.ext.gfm.strikethrough.StrikethroughExtension;
import org.commonmark.ext.gfm.tables.TableBlock;
import org.commonmark.ext.gfm.tables.TableCell;
import org.commonmark.ext.gfm.tables.TableRow;
import org.commonmark.ext.gfm.tables.TablesExtension;
import org.commonmark.ext.task.list.items.TaskListItemMarker;
import org.commonmark.ext.task.list.items.TaskListItemsExtension;
import org.commonmark.node.BlockQuote;
import org.commonmark.node.BulletList;
import org.commonmark.node.Code;
import org.commonmark.node.Emphasis;
import org.commonmark.node.FencedCodeBlock;
import org.commonmark.node.HardLineBreak;
import org.commonmark.node.Heading;
import org.commonmark.node.HtmlBlock;
import org.commonmark.node.HtmlInline;
import org.commonmark.node.Image;
import org.commonmark.node.IndentedCodeBlock;
import org.commonmark.node.Link;
import org.commonmark.node.ListItem;
import org.commonmark.node.Node;
import org.commonmark.node.OrderedList;
import org.commonmark.node.Paragraph;
import org.commonmark.node.SoftLineBreak;
import org.commonmark.node.StrongEmphasis;
import org.commonmark.node.Text;
import org.commonmark.node.ThematicBreak;
import org.commonmark.parser.IncludeSourceSpans;
import org.commonmark.parser.Parser;
import xyz.goraebap.workspace.richbody.BodyColors;

/**
 * Markdown as the body editor's JSON (Tiptap, schema version 1), for bodies that come written elsewhere: imports and
 * agents. CommonMark with GFM tables, task lists and strikethrough; a quote that starts with a GFM alert ([!NOTE],
 * [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]) becomes a callout, a mermaid fence a diagram and a math fence a formula.
 * Headings deeper than four go to four. Standalone attachment images and links become media; standalone autolinks
 * become web embeds. Details/summary preserves toggles, and block comments address opaque existing editor blocks.
 * Other images remain links and other HTML remains text.
 */
final class MarkdownBody {
    private static final Parser PARSER = Parser.builder()
            .extensions(
                    List.of(TablesExtension.create(), StrikethroughExtension.create(), TaskListItemsExtension.create()))
            .includeSourceSpans(IncludeSourceSpans.BLOCKS)
            .build();
    private static final Pattern ALERT = Pattern.compile("^\\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)]\\s*");
    private static final Map<String, String> TONES =
            Map.of("NOTE", "info", "TIP", "tip", "IMPORTANT", "warning", "WARNING", "warning", "CAUTION", "danger");
    private static final int HEADING_MAX = 4;

    private MarkdownBody() {}

    static Map<String, Object> toDocument(String markdown) {
        // 색 태그는 줄마다 짝이 맞게 고친 뒤 읽는다(BodyColors.repair).
        String source = markdown == null ? "" : BodyColors.repair(markdown);
        var parsed = PARSER.parse(source);
        replaceDetails(parsed, source);
        var blocks = blocks(parsed);
        if (blocks.isEmpty()) blocks.add(node("paragraph"));
        return node("doc", blocks);
    }

    private static List<Map<String, Object>> blocks(Node parent) {
        var blocks = new ArrayList<Map<String, Object>>();
        for (Node child = parent.getFirstChild(); child != null; child = child.getNext()) {
            if (child instanceof Paragraph paragraph) {
                var media = attachments(paragraph);
                if (!media.isEmpty()) {
                    blocks.addAll(media);
                    continue;
                }
            }
            var block = block(child);
            if (block != null) blocks.add(block);
        }
        return blocks;
    }

    private static Map<String, Object> block(Node node) {
        return switch (node) {
            case Heading heading ->
                withContent(
                        node("heading", Map.of("level", Math.min(heading.getLevel(), HEADING_MAX))), inline(heading));
            case Paragraph paragraph -> paragraph(paragraph);
            case Details details -> details.body;
            case BlockQuote quote -> quote(quote);
            case BulletList list -> list(list, Map.of());
            case OrderedList list ->
                list(list, Map.of("start", Objects.requireNonNullElse(list.getMarkerStartNumber(), 1)));
            case FencedCodeBlock code -> code(code.getInfo(), code.getLiteral());
            case IndentedCodeBlock code -> code("", code.getLiteral());
            case ThematicBreak ignored -> node("horizontalRule");
            case TableBlock table -> table(table);
            case HtmlBlock html -> {
                String literal = html.getLiteral().strip();
                var preserved =
                        Pattern.compile("<!-- block:([A-Za-z0-9_-]+) -->").matcher(literal);
                if (preserved.matches()) yield node("preservedBlock", Map.of("blockId", preserved.group(1)));
                yield literal.isEmpty() || literal.startsWith("<!--")
                        ? null
                        : withContent(node("paragraph"), List.of(text(literal, List.of())));
            }
            default -> null;
        };
    }

    private static Map<String, Object> paragraph(Paragraph paragraph) {
        if (paragraph.getFirstChild() instanceof Link link
                && link.getNext() == null
                && link.getDestination().matches("https://[^\\s<>]+")
                && link.getFirstChild() instanceof Text text
                && text.getNext() == null
                && text.getLiteral().equals(link.getDestination()))
            return node("webEmbed", Map.of("source", link.getDestination()));
        return withContent(node("paragraph"), inline(paragraph));
    }

    private static List<Map<String, Object>> attachments(Paragraph paragraph) {
        var result = new ArrayList<Map<String, Object>>();
        for (Node child = paragraph.getFirstChild(); child != null; child = child.getNext()) {
            if (child instanceof SoftLineBreak
                    || child instanceof HardLineBreak
                    || child instanceof Text text && text.getLiteral().isBlank()) continue;
            String source = child instanceof Image image
                    ? image.getDestination()
                    : child instanceof Link link ? link.getDestination() : "";
            if (!source.startsWith("attachment:")) return List.of();
            String name = inline(child).stream()
                    .map(n -> Objects.toString(n.get("text"), ""))
                    .collect(java.util.stream.Collectors.joining());
            result.add(node(
                    "media",
                    Map.of(
                            "src",
                            source,
                            "name",
                            name,
                            "mime",
                            child instanceof Image ? "image/png" : "application/octet-stream")));
        }
        return result;
    }

    private static final class Details extends org.commonmark.node.CustomBlock {
        private final Map<String, Object> body;

        private Details(Map<String, Object> body) {
            this.body = body;
        }
    }

    /** CommonMark identifies real HTML blocks, leaving code fences and inline code untouched. */
    private static void replaceDetails(Node root, String source) {
        var lines = source.split("\n", -1);
        var offsets = new int[lines.length];
        for (int i = 1; i < lines.length; i++) offsets[i] = offsets[i - 1] + lines[i - 1].length() + 1;
        replaceDetails(root, source, offsets);
    }

    private static void replaceDetails(Node root, String source, int[] offsets) {
        for (Node child = root.getFirstChild(); child != null; ) {
            Node next = child.getNext();
            if (child instanceof HtmlBlock html
                    && html.getLiteral().stripLeading().startsWith("<details")
                    && !child.getSourceSpans().isEmpty()) {
                var span = child.getSourceSpans().getFirst();
                int start = offsets[span.getLineIndex()] + span.getColumnIndex();
                var tags = Pattern.compile("(?m)^[ \\t]{0,3}(?:>\\s*)*(`{3,}|~{3,})[^\\n]*$|</?details(?:\\s[^>]*)?>")
                        .matcher(source);
                tags.region(start, source.length());
                int depth = 0, end = -1, opening = -1, closing = -1;
                boolean open = false;
                String fence = null;
                while (tags.find()) {
                    if (tags.group(1) != null) {
                        String marker = tags.group(1);
                        if (fence == null) fence = marker;
                        else if (marker.charAt(0) == fence.charAt(0)
                                && marker.length() >= fence.length()
                                && tags.group().stripTrailing().endsWith(marker)) fence = null;
                        continue;
                    }
                    if (fence != null) continue;
                    if (tags.group().startsWith("</")) {
                        if (--depth == 0) {
                            closing = tags.start();
                            end = tags.end();
                            break;
                        }
                    } else {
                        if (depth++ == 0) {
                            opening = tags.end();
                            open = tags.group().matches("(?s).*\\sopen(?:\\s|=|>).*");
                        }
                    }
                }
                if (end < 0) throw new IllegalArgumentException("토글의 </details>가 없습니다.");
                String inside = source.substring(opening, closing);
                if (span.getColumnIndex() > 0) {
                    String[] nestedLines = inside.split("\n", -1);
                    for (int line = 1; line < nestedLines.length; line++) {
                        int prefix = Math.min(span.getColumnIndex(), nestedLines[line].length());
                        if (nestedLines[line].substring(0, prefix).matches("[ >\\t]*"))
                            nestedLines[line] = nestedLines[line].substring(prefix);
                    }
                    inside = String.join("\n", nestedLines);
                }
                inside = inside.strip();
                var summary = Pattern.compile("(?s)^<summary>(.*?)</summary>").matcher(inside);
                if (!summary.find()) throw new IllegalArgumentException("토글에는 <summary>제목</summary>가 필요합니다.");
                var title = PARSER.parse(summary.group(1));
                var summaryContent =
                        title.getFirstChild() == null ? List.<Map<String, Object>>of() : inline(title.getFirstChild());
                var body = toDocument(inside.substring(summary.end()).strip());
                var replacement = new Details(node(
                        "toggle",
                        Map.of("open", open),
                        List.of(node("toggleSummary", summaryContent), node("toggleBody", content(body)))));
                child.insertBefore(replacement);
                while (next != null && !next.getSourceSpans().isEmpty()) {
                    var at = next.getSourceSpans().getFirst();
                    if (offsets[at.getLineIndex()] + at.getColumnIndex() >= end) break;
                    Node removed = next;
                    next = next.getNext();
                    removed.unlink();
                }
                // Content after a one-line closing tag belongs to the following paragraph.
                var last = child.getSourceSpans().getLast();
                int blockEnd = offsets[last.getLineIndex()] + last.getColumnIndex() + last.getLength();
                if (blockEnd > end && !source.substring(end, blockEnd).isBlank())
                    throw new IllegalArgumentException("</details> 뒤에는 줄을 바꾸세요.");
                child.unlink();
            } else if (child.getFirstChild() != null
                    && !(child instanceof FencedCodeBlock || child instanceof IndentedCodeBlock))
                replaceDetails(child, source, offsets);
            child = next;
        }
    }

    /** A quote, or a callout when it opens with an alert marker, the marker taken out. */
    private static Map<String, Object> quote(BlockQuote quote) {
        var content = blocks(quote);
        if (!content.isEmpty() && quote.getFirstChild() instanceof Paragraph first) {
            var lead = first.getFirstChild();
            var alert = lead instanceof Text text ? ALERT.matcher(text.getLiteral()) : null;
            if (alert != null && alert.find()) {
                String tone = TONES.get(alert.group(1));
                var opening = new ArrayList<>(content(content.getFirst()));
                if (!opening.isEmpty()) {
                    var rest = ((String) opening.getFirst().get("text"))
                            .substring(alert.end())
                            .stripLeading();
                    if (rest.isEmpty()) opening.removeFirst();
                    else opening.set(0, text(rest, marks(opening.getFirst())));
                    // A line break right after the marker opens the callout's text; it is not part of it.
                    if (!opening.isEmpty()
                            && "hardBreak".equals(opening.getFirst().get("type"))) opening.removeFirst();
                }
                var blocks = new ArrayList<>(content.subList(1, content.size()));
                if (!opening.isEmpty()) blocks.addFirst(withContent(node("paragraph"), opening));
                if (blocks.isEmpty()) blocks.add(node("paragraph"));
                return node("callout", Map.of("tone", tone), blocks);
            }
        }
        if (content.isEmpty()) content.add(node("paragraph"));
        return node("blockquote", content);
    }

    /** A list; with a task marker on any item, a task list whose items say whether they are done. */
    private static Map<String, Object> list(Node list, Map<String, Object> attrs) {
        boolean tasks = false;
        for (Node item = list.getFirstChild(); item != null; item = item.getNext())
            if (item.getFirstChild() instanceof TaskListItemMarker) tasks = true;
        var items = new ArrayList<Map<String, Object>>();
        for (Node item = list.getFirstChild(); item != null; item = item.getNext()) {
            if (!(item instanceof ListItem)) continue;
            var content = new ArrayList<>(blocks(item));
            boolean checked = false;
            for (Node child = item.getFirstChild(); child != null; child = child.getNext()) {
                if (child instanceof TaskListItemMarker marker) {
                    checked = marker.isChecked();
                    continue;
                }
            }
            // An item opens with a paragraph in the editor.
            if (content.isEmpty() || !"paragraph".equals(content.getFirst().get("type")))
                content.addFirst(node("paragraph"));
            items.add(
                    tasks
                            ? node("taskItem", Map.of("checked", checked), content)
                            : node("listItem", Map.of(), content));
        }
        if (items.isEmpty()) return null;
        String type = tasks ? "taskList" : list instanceof OrderedList ? "orderedList" : "bulletList";
        return node(type, tasks ? Map.of() : attrs, items);
    }

    private static Map<String, Object> code(String info, String literal) {
        String language = info == null ? "" : info.strip().split("\\s+", 2)[0].toLowerCase(Locale.ROOT);
        String source = literal.endsWith("\n") ? literal.substring(0, literal.length() - 1) : literal;
        if (language.equals("mermaid")) return node("mermaidBlock", Map.of("source", source));
        if (language.equals("math") || language.equals("latex") || language.equals("katex"))
            return node("mathBlock", Map.of("source", source));
        var block = node("codeBlock", language.isEmpty() ? Map.of() : Map.of("language", language));
        return source.isEmpty() ? block : withContent(block, List.of(text(source, List.of())));
    }

    private static Map<String, Object> table(TableBlock table) {
        var rows = new ArrayList<Map<String, Object>>();
        collectRows(table, rows);
        return rows.isEmpty() ? null : node("table", rows);
    }

    private static void collectRows(Node parent, List<Map<String, Object>> rows) {
        for (Node child = parent.getFirstChild(); child != null; child = child.getNext()) {
            if (child instanceof TableRow row) {
                var cells = new ArrayList<Map<String, Object>>();
                for (Node cell = row.getFirstChild(); cell != null; cell = cell.getNext())
                    if (cell instanceof TableCell tableCell)
                        cells.add(node(
                                tableCell.isHeader() ? "tableHeader" : "tableCell",
                                List.of(withContent(node("paragraph"), inline(tableCell)))));
                if (!cells.isEmpty()) rows.add(node("tableRow", cells));
            } else collectRows(child, rows);
        }
    }

    /** A block's inline content: text with its marks, adjacent text of the same marks joined, and line breaks. */
    private static List<Map<String, Object>> inline(Node parent) {
        var content = new ArrayList<Map<String, Object>>();
        inline(parent, List.of(), content);
        return content;
    }

    /**
     * 글의 표식을 따라 인라인을 훑는다. 색 태그(<mark data-color>·<span data-color>)는 글로 넣지 않고, 뒤따르는 형제 마디에
     * 형광펜·글자색 표식을 열었다가 닫는 태그에서 닫는다. ==…==는 노랑 형광펜이다(한 마디 안에서 짝이 맞을 때만).
     */
    private static void inline(Node parent, List<Map<String, Object>> marks, List<Map<String, Object>> content) {
        var colors = new ArrayList<Map<String, Object>>();
        var tags = new ArrayList<String>();
        for (Node child = parent.getFirstChild(); child != null; child = child.getNext()) {
            List<Map<String, Object>> here = colors.isEmpty() ? marks : withAll(marks, colors);
            switch (child) {
                case Text text -> appendText(content, text.getLiteral(), here);
                case SoftLineBreak ignored -> append(content, " ", here);
                case HardLineBreak ignored -> content.add(node("hardBreak"));
                // Code takes no other mark in the editor.
                case Code code -> append(content, code.getLiteral(), List.of(mark("code", Map.of())));
                case HtmlInline html -> {
                    var tag = BodyColors.parse(html.getLiteral());
                    if (tag.isEmpty()) append(content, html.getLiteral(), here);
                    else if (tag.get().size() == 2) {
                        var color =
                                BodyColors.markOf(tag.get().get(0), tag.get().get(1));
                        if (color.isPresent()) {
                            colors.add(color.get());
                            tags.add(tag.get().get(0));
                        }
                    } else
                        for (int i = tags.size() - 1; i >= 0; i--)
                            if (tags.get(i).equals(tag.get().get(0))) {
                                tags.remove(i);
                                colors.remove(i);
                                break;
                            }
                }
                case Emphasis ignored -> inline(child, with(here, mark("italic", Map.of())), content);
                case StrongEmphasis ignored -> inline(child, with(here, mark("bold", Map.of())), content);
                case Strikethrough ignored -> inline(child, with(here, mark("strike", Map.of())), content);
                case Link link ->
                    inline(child, with(here, mark("link", Map.of("href", link.getDestination()))), content);
                case Image image -> {
                    int before = content.size();
                    var linked = with(here, mark("link", Map.of("href", image.getDestination())));
                    inline(child, linked, content);
                    if (content.size() == before) append(content, image.getDestination(), linked);
                }
                default -> inline(child, here, content);
            }
        }
    }

    private static final Pattern YELLOW = Pattern.compile("==([^=\n]+?)==");

    /** 글 한 마디: ==…==는 노랑 형광펜으로, 나머지는 그대로. */
    private static void appendText(List<Map<String, Object>> content, String value, List<Map<String, Object>> marks) {
        var match = YELLOW.matcher(value == null ? "" : value);
        int last = 0;
        while (match.find()) {
            append(content, value.substring(last, match.start()), marks);
            var yellow = BodyColors.markOf("mark", "yellow").orElseThrow();
            append(content, match.group(1), with(marks, yellow));
            last = match.end();
        }
        append(content, value == null ? null : value.substring(last), marks);
    }

    private static List<Map<String, Object>> withAll(List<Map<String, Object>> marks, List<Map<String, Object>> more) {
        var next = new ArrayList<>(marks);
        next.addAll(more);
        return List.copyOf(next);
    }

    private static void append(List<Map<String, Object>> content, String value, List<Map<String, Object>> marks) {
        if (value == null || value.isEmpty()) return;
        if (!content.isEmpty()) {
            var last = content.getLast();
            if ("text".equals(last.get("type")) && marks(last).equals(marks)) {
                content.set(content.size() - 1, text(last.get("text") + value, marks));
                return;
            }
        }
        content.add(text(value, marks));
    }

    private static List<Map<String, Object>> with(List<Map<String, Object>> marks, Map<String, Object> mark) {
        var next = new ArrayList<>(marks);
        next.add(mark);
        return List.copyOf(next);
    }

    private static Map<String, Object> text(String value, List<Map<String, Object>> marks) {
        var text = new LinkedHashMap<String, Object>();
        text.put("type", "text");
        text.put("text", value);
        if (!marks.isEmpty()) text.put("marks", marks);
        return text;
    }

    private static Map<String, Object> mark(String type, Map<String, Object> attrs) {
        var mark = new LinkedHashMap<String, Object>();
        mark.put("type", type);
        if (!attrs.isEmpty()) mark.put("attrs", attrs);
        return mark;
    }

    // A node's content and marks are lists of JSON objects, as this class builds them.
    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> content(Map<String, Object> node) {
        return (List<Map<String, Object>>) node.getOrDefault("content", List.of());
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> marks(Map<String, Object> node) {
        return (List<Map<String, Object>>) node.getOrDefault("marks", List.of());
    }

    private static Map<String, Object> node(String type) {
        return node(type, Map.of(), List.of());
    }

    private static Map<String, Object> node(String type, List<Map<String, Object>> content) {
        return node(type, Map.of(), content);
    }

    private static Map<String, Object> node(String type, Map<String, Object> attrs) {
        return node(type, attrs, List.of());
    }

    private static Map<String, Object> node(String type, Map<String, Object> attrs, List<Map<String, Object>> content) {
        var node = new LinkedHashMap<String, Object>();
        node.put("type", type);
        if (!attrs.isEmpty()) node.put("attrs", attrs);
        if (!content.isEmpty()) node.put("content", new ArrayList<>(content));
        return node;
    }

    private static Map<String, Object> withContent(Map<String, Object> node, List<Map<String, Object>> content) {
        if (!content.isEmpty()) node.put("content", new ArrayList<>(content));
        return node;
    }
}

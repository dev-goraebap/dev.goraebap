package xyz.goraebap.productivity.document.application;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * A Markdown body cut along its headings, so an agent reads and writes one part of a long document rather than all of
 * it (cowork-guide-agent-access, 읽는 순서). A section is a heading with everything under it down to the next heading of
 * its level or higher, its sub-sections among it; the text before the first heading is the section _intro. Each has
 * an id made of its heading's words (the same heading in the same body always has the same id; a heading written again
 * further down gets -2, -3). Headings inside fenced code are text.
 */
final class MarkdownSections {
    /** The id of the text before the first heading. */
    static final String INTRO = "_intro";

    private static final Pattern HEADING = Pattern.compile("^(#{1,6})\\s+(.*?)\\s*#*\\s*$");
    private static final Pattern FENCE = Pattern.compile("^\\s{0,3}(```|~~~)");
    private static final Pattern EXPLICIT_SUMMARY =
            Pattern.compile("^\\s*>?\\s*(?:요약|summary)\\s*[:：]\\s*(.+)$", Pattern.CASE_INSENSITIVE);
    private static final int SUMMARY_MAX = 200;

    /** One section: its id, heading level (0 for the intro), heading words and where it lies in the body. */
    record Section(String id, int level, String title, int start, int headingEnd, int end) {
        int size() {
            return end - start;
        }
    }

    private final String markdown;
    private final List<Section> sections;

    private MarkdownSections(String markdown, List<Section> sections) {
        this.markdown = markdown;
        this.sections = List.copyOf(sections);
    }

    static MarkdownSections of(String markdown) {
        String text = markdown == null ? "" : markdown;
        record Heading(int level, String title, int start, int headingEnd) {}
        var headings = new ArrayList<Heading>();
        boolean inFence = false;
        int detailsDepth = 0;
        int at = 0;
        for (String line : text.split("\n", -1)) {
            int next = at + line.length() + 1;
            if (FENCE.matcher(line).find()) inFence = !inFence;
            else if (!inFence) {
                var heading = HEADING.matcher(line);
                if (detailsDepth == 0 && heading.matches())
                    headings.add(new Heading(
                            heading.group(1).length(), heading.group(2).strip(), at, Math.min(next, text.length())));
            }
            if (!inFence) {
                var details = Pattern.compile("</?details(?:\\s[^>]*)?>").matcher(line);
                while (details.find())
                    detailsDepth = Math.max(0, detailsDepth + (details.group().startsWith("</") ? -1 : 1));
            }
            at = next;
        }
        var sections = new ArrayList<Section>();
        int first = headings.isEmpty() ? text.length() : headings.getFirst().start();
        if (!text.substring(0, first).isBlank()) sections.add(new Section(INTRO, 0, "", 0, 0, first));
        var seen = new HashMap<String, Integer>();
        for (int index = 0; index < headings.size(); index++) {
            var heading = headings.get(index);
            int end = text.length();
            for (int later = index + 1; later < headings.size(); later++)
                if (headings.get(later).level() <= heading.level()) {
                    end = headings.get(later).start();
                    break;
                }
            String slug = slug(heading.title());
            int count = seen.merge(slug, 1, Integer::sum);
            sections.add(new Section(
                    count == 1 ? slug : slug + "-" + count,
                    heading.level(),
                    heading.title(),
                    heading.start(),
                    heading.headingEnd(),
                    end));
        }
        return new MarkdownSections(text, sections);
    }

    /** The headings as a tree: each section's id, words, level and size, its sub-sections under it. */
    List<Map<String, Object>> outline() {
        var roots = new ArrayList<Map<String, Object>>();
        var open = new ArrayDeque<Map.Entry<Integer, List<Map<String, Object>>>>();
        for (var section : sections) {
            var node = new LinkedHashMap<String, Object>();
            node.put("id", section.id());
            if (section.level() > 0) {
                node.put("title", section.title());
                node.put("level", section.level());
            }
            node.put("size", section.size());
            while (!open.isEmpty() && open.peek().getKey() >= section.level()) open.pop();
            (open.isEmpty() || section.level() == 0 ? roots : open.peek().getValue()).add(node);
            if (section.level() > 0) {
                var children = new ArrayList<Map<String, Object>>();
                node.put("children", children);
                open.push(Map.entry(section.level(), children));
            }
        }
        prune(roots);
        return roots;
    }

    private static void prune(List<Map<String, Object>> nodes) {
        for (var node : nodes) {
            @SuppressWarnings("unchecked")
            var children = (List<Map<String, Object>>) node.get("children");
            if (children == null) continue;
            if (children.isEmpty()) node.remove("children");
            else prune(children);
        }
    }

    /**
     * The section an agent names: by its id, or by its heading's words as a path from an outer heading
     * ("설계/화면") or alone when they are written once.
     */
    Optional<Section> find(String name) {
        String wanted = name.strip();
        var byId =
                sections.stream().filter(section -> section.id().equals(wanted)).findFirst();
        if (byId.isPresent()) return byId;
        String[] path = wanted.split("/");
        List<Section> found = sections.stream()
                .filter(section ->
                        section.level() > 0 && section.title().equalsIgnoreCase(path[path.length - 1].strip()))
                .filter(section -> path.length == 1 || isUnder(section, path))
                .toList();
        return found.size() == 1 ? Optional.of(found.getFirst()) : Optional.empty();
    }

    /** Whether the outer headings of a section are, from the top, the path's earlier parts. */
    private boolean isUnder(Section section, String[] path) {
        int part = path.length - 2;
        int level = section.level();
        for (int index = sections.indexOf(section) - 1; index >= 0 && part >= 0; index--) {
            var outer = sections.get(index);
            if (outer.level() == 0 || outer.level() >= level || outer.end() < section.end()) continue;
            if (!outer.title().equalsIgnoreCase(path[part].strip())) return false;
            level = outer.level();
            part--;
        }
        return part < 0;
    }

    /** The ids an agent may name, for a message about one it named wrong. */
    String ids() {
        return sections.stream().map(Section::id).collect(Collectors.joining(", "));
    }

    String text(Section section) {
        return markdown.substring(section.start(), section.end());
    }

    /**
     * The body with one section written anew: written from its heading when the new text starts with one, else under
     * the heading it had. One blank line keeps it from what follows.
     */
    String replace(Section section, String written) {
        String after = markdown.substring(section.end());
        return markdown.substring(0, section.start())
                + written(section, written)
                + (after.isEmpty() ? "\n" : "\n\n" + after);
    }

    /** The section alone as written anew: from its own heading when the text starts with one, else under the old one. */
    String written(Section section, String written) {
        String body = written.strip();
        String head = body.startsWith("#") || section.level() == 0
                ? ""
                : markdown.substring(section.start(), section.headingEnd()).stripTrailing() + "\n\n";
        return head + body;
    }

    /**
     * A body's summary for a list: a line it writes as one (요약: …, as a quote or not), else its first paragraph that is
     * not a heading, in plain words, at most 200 letters.
     */
    static String summaryOf(String text) {
        if (text == null || text.isBlank()) return null;
        // An explicit summary wins even after a long introduction, except inside a fenced example.
        boolean fenced = false;
        for (String line : text.split("\n")) {
            if (FENCE.matcher(line).find()) {
                fenced = !fenced;
                continue;
            }
            var explicit = EXPLICIT_SUMMARY.matcher(line);
            if (!fenced && explicit.matches()) return clip(plain(explicit.group(1)));
        }
        var paragraph = new StringBuilder();
        boolean inFence = false;
        for (String line : text.split("\n")) {
            var explicit = EXPLICIT_SUMMARY.matcher(line);
            if (paragraph.isEmpty() && explicit.matches()) return clip(plain(explicit.group(1)));
            if (FENCE.matcher(line).find()) {
                inFence = !inFence;
                continue;
            }
            if (inFence || HEADING.matcher(line).matches()) {
                if (!paragraph.isEmpty()) break;
                continue;
            }
            if (line.isBlank()) {
                if (!paragraph.isEmpty()) break;
                continue;
            }
            paragraph.append(paragraph.isEmpty() ? "" : " ").append(plain(line));
        }
        return paragraph.isEmpty() ? null : clip(paragraph.toString());
    }

    /**
     * Where a body says the words: each matching line with the line before and after it, at most a few, so a search
     * shows why a document matched without its whole body.
     */
    static List<String> snippets(String text, String words, int most) {
        if (text == null || words == null || words.isBlank()) return List.of();
        String wanted = words.strip().toLowerCase(Locale.ROOT);
        String[] lines = text.split("\n");
        var snippets = new ArrayList<String>();
        int shownTo = -1;
        for (int index = 0; index < lines.length && snippets.size() < most; index++) {
            if (index <= shownTo || !lines[index].toLowerCase(Locale.ROOT).contains(wanted)) continue;
            int from = Math.max(0, index - 1);
            int to = Math.min(lines.length - 1, index + 1);
            var snippet = new StringBuilder();
            for (int line = Math.max(from, shownTo + 1); line <= to; line++)
                if (!lines[line].isBlank())
                    snippet.append(snippet.isEmpty() ? "" : "\n").append(lines[line].strip());
            snippets.add(snippet.toString());
            shownTo = to;
        }
        return snippets;
    }

    private static String plain(String line) {
        return line.replaceAll("^\\s*(>\\s*)+", "")
                .replaceAll("^\\s*([-*+]|\\d+\\.)\\s+(\\[[ xX]]\\s+)?", "")
                .replaceAll("!?\\[([^]]*)]\\([^)]*\\)", "$1")
                .replaceAll("[*_`~]+", "")
                .strip();
    }

    private static String clip(String text) {
        return text.length() <= SUMMARY_MAX ? text : text.substring(0, SUMMARY_MAX - 1) + "…";
    }

    /** A heading's words as an id: letters and digits of any script, other runs as one dash, lower case. */
    private static String slug(String title) {
        String slug = title.toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{L}\\p{N}]+", "-")
                .replaceAll("^-+|-+$", "");
        return slug.isEmpty() ? "section" : slug;
    }
}

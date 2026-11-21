package xyz.goraebap.cowork.module.workspace.richbody;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 마크다운으로 저장하는 본문(주간보고·회의록 등)의 글자색·형광펜. 마크다운에는 {@code <span data-color="red">…</span>}(글자색),
 * {@code <mark data-color="green">…</mark>}(형광펜)로 남고, 리치 본문에서는 textStyle·highlight 표식의 color(편집기 색표의
 * 16진 값)다. 이름과 값은 화면(web/src/shared/lib/rich-document/body-colors.tsx, EditorSurface의 색표)과 같다.
 */
public final class BodyColors {
    private static final Map<String, String> TEXT = Map.of(
            "gray", "#9b9a97", "brown", "#ba927a", "orange", "#df9b65", "yellow", "#d8bd6a", "green", "#89af8b", "blue",
            "#80afcf", "purple", "#b59aca", "pink", "#cf91b1", "red", "#d98c87");
    private static final Map<String, String> MARK = Map.of(
            "gray", "#363633", "brown", "#493b34", "orange", "#533f2c", "yellow", "#514a2c", "green", "#304638", "blue",
            "#2d4153", "purple", "#41344f", "pink", "#4d3543", "red", "#503631");
    private static final Pattern HEX = Pattern.compile("#[0-9a-fA-F]{6}");
    private static final Pattern TAG = Pattern.compile("<(mark|span)\\s+data-color=\"([#\\w-]+)\"\\s*>|</(mark|span)>");
    private static final Pattern OPEN_TAG = Pattern.compile("<(mark|span)\\s+data-color=\"([#\\w-]+)\"\\s*>");
    private static final Pattern CLOSE_TAG = Pattern.compile("</(mark|span)>");
    private static final Pattern BLOCK =
            Pattern.compile("^(\\s*(?:[-*+]\\s+(?:\\[[ xX]\\]\\s+)?|\\d+[.)]\\s+|#{1,6}\\s+|>\\s*)*)");

    private BodyColors() {}

    /** 태그 하나의 리치 표식: 형광펜은 highlight, 글자색은 textStyle. 모르는 색이면 비어 있다. */
    public static Optional<Map<String, Object>> markOf(String tag, String key) {
        boolean highlight = "mark".equals(tag);
        String color = HEX.matcher(key).matches() ? key.toLowerCase() : (highlight ? MARK : TEXT).get(key);
        if (color == null) return Optional.empty();
        return Optional.of(Map.of("type", highlight ? "highlight" : "textStyle", "attrs", Map.of("color", color)));
    }

    /** 리치 표식 하나를 여는 태그로: 편집기 색표의 값이면 이름으로, 아니면 16진 값 그대로. 색이 없으면 비어 있다. */
    public static Optional<String> openTag(String type, Object color) {
        if (!(color instanceof String value) || !HEX.matcher(value).matches()) return Optional.empty();
        boolean highlight = "highlight".equals(type);
        String key = (highlight ? MARK : TEXT)
                .entrySet().stream()
                        .filter(entry -> entry.getValue().equalsIgnoreCase(value))
                        .map(Map.Entry::getKey)
                        .findFirst()
                        .orElse(value.toLowerCase());
        return Optional.of("<" + (highlight ? "mark" : "span") + " data-color=\"" + key + "\">");
    }

    public static String closeTag(String type) {
        return "highlight".equals(type) ? "</mark>" : "</span>";
    }

    /** 여는 태그면 [태그, 색], 닫는 태그면 [태그], 색 태그가 아니면 비어 있다. */
    public static Optional<List<String>> parse(String html) {
        String literal = html.strip();
        Matcher open = OPEN_TAG.matcher(literal);
        if (open.matches()) return Optional.of(List.of(open.group(1), open.group(2)));
        Matcher close = CLOSE_TAG.matcher(literal);
        if (close.matches()) return Optional.of(List.of(close.group(1)));
        return Optional.empty();
    }

    /**
     * 색 태그를 줄마다 닫고 다시 연다. 옛 화면은 색이 여러 줄(문단 → 목록)에 걸쳐 열리고 닫히게 남겼는데, 마크다운은 줄(블록)을
     * 넘는 인라인 표기를 모른다. 줄 끝에서 열린 색을 닫고 다음 줄의 목록·제목 기호 뒤에서 다시 열어 한 줄 안에서 짝이 맞게 한다.
     * 같은 색이 겹쳐 열린 것은 하나로 치고, 짝 없는 닫는 태그는 지운다. 코드 블록 안은 건드리지 않는다.
     */
    public static String repair(String markdown) {
        if (markdown == null || !markdown.contains("data-color=")) return markdown;
        final class Open {
            final String tag;
            final String key;
            int depth = 1;

            Open(String tag, String key) {
                this.tag = tag;
                this.key = key;
            }
        }
        var open = new ArrayList<Open>();
        var out = new StringBuilder();
        boolean fenced = false;
        String[] lines = markdown.split("\n", -1);
        for (int index = 0; index < lines.length; index++) {
            String line = lines[index];
            if (index > 0) out.append('\n');
            if (line.stripLeading().startsWith("```") || line.stripLeading().startsWith("~~~")) {
                fenced = !fenced;
                out.append(line);
                continue;
            }
            // 코드 블록 안과 빈 줄은 그대로 둔다(빈 줄에 태그를 넣으면 문단·목록의 경계가 사라진다).
            if (fenced || line.isBlank()) {
                out.append(line);
                continue;
            }
            Matcher lead = BLOCK.matcher(line);
            String prefix = lead.find() ? lead.group(1) : "";
            String body = line.substring(prefix.length());
            var reopen = new StringBuilder();
            for (var each : open)
                reopen.append('<')
                        .append(each.tag)
                        .append(" data-color=\"")
                        .append(each.key)
                        .append("\">");
            var rewritten = new StringBuilder();
            Matcher tag = TAG.matcher(body);
            int last = 0;
            while (tag.find()) {
                rewritten.append(body, last, tag.start());
                last = tag.end();
                if (tag.group(1) != null) {
                    // 같은 색을 겹쳐 연 것은 하나로 쓰되 몇 번 열렸는지 세어, 그만큼 닫혀야 끝낸다.
                    var same = open.stream()
                            .filter(each -> each.tag.equals(tag.group(1)) && each.key.equals(tag.group(2)))
                            .findFirst();
                    if (same.isPresent()) {
                        same.get().depth++;
                        continue;
                    }
                    open.add(new Open(tag.group(1), tag.group(2)));
                    rewritten.append(tag.group());
                } else {
                    int at = -1;
                    for (int i = open.size() - 1; i >= 0; i--)
                        if (open.get(i).tag.equals(tag.group(3))) {
                            at = i;
                            break;
                        }
                    if (at < 0 || --open.get(at).depth > 0) continue;
                    open.remove(at);
                    rewritten.append(tag.group());
                }
            }
            rewritten.append(body.substring(last));
            var close = new StringBuilder();
            for (int i = open.size() - 1; i >= 0; i--)
                close.append("</").append(open.get(i).tag).append('>');
            out.append(prefix).append(reopen).append(rewritten).append(close);
        }
        return out.toString();
    }
}

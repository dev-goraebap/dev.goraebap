package xyz.goraebap.cowork.shared.text;

/**
 * Finding words in text written in the editor as Markdown, for searches that show why something was found: the text
 * around the first place it holds the words, read without its marks.
 */
public final class TextExcerpt {
    private static final int BEFORE = 30;
    private static final int LENGTH = 90;

    private TextExcerpt() {}

    /** Whether the text holds the words, ignoring case. */
    public static boolean contains(String text, String words) {
        return text != null && indexIgnoringCase(text, words) >= 0;
    }

    /**
     * About 90 characters of the text around the first place it holds the words, with … where it was cut, or null when
     * it does not hold them.
     */
    public static String around(String body, String words) {
        if (body == null) return null;
        String flat = plainText(body).replaceAll("\\s+", " ").strip();
        int at = indexIgnoringCase(flat, words);
        // The words may stand across marks the plain text dropped; the raw text still says where.
        if (at < 0) {
            flat = body.replaceAll("\\s+", " ").strip();
            at = indexIgnoringCase(flat, words);
        }
        if (at < 0) return null;
        int from = Math.max(0, at - BEFORE);
        int to = Math.min(flat.length(), from + LENGTH);
        // Never cut a character in two at either end.
        if (from > 0 && Character.isLowSurrogate(flat.charAt(from))) from--;
        if (to < flat.length() && Character.isLowSurrogate(flat.charAt(to))) to++;
        return (from > 0 ? "…" : "") + flat.substring(from, to) + (to < flat.length() ? "…" : "");
    }

    /**
     * Text, written in the editor as Markdown, read without its marks: fences, headings, quotes, list and
     * checklist markers, emphasis, highlights, inline code and table rules go; a link keeps its words.
     */
    public static String plainText(String markdown) {
        return markdown.replaceAll("(?m)^\\s*```.*$", "")
                .replaceAll("(?m)^\\s{0,3}#{1,6}\\s+", "")
                .replaceAll("(?m)^\\s*>\\s?", "")
                .replaceAll("(?m)^\\s*(?:[-*+]|\\d+\\.)\\s+(?:\\[[ xX]\\]\\s+)?", "")
                .replaceAll("(?m)^\\s*\\|?\\s*:?-{3,}:?\\s*(?:\\|\\s*:?-{3,}:?\\s*)*\\|?\\s*$", "")
                .replaceAll("\\[([^\\]]*)\\]\\([^)]*\\)", "$1")
                .replaceAll("(\\*\\*|__|~~|==|`)", "")
                .replaceAll("(?<!\\\\)\\|", " ")
                .replace("<br>", " ")
                // A mark written as text (\## or \*) reads as the mark itself.
                .replaceAll("\\\\([\\\\`*_{}\\[\\]()#+\\-.!>|=~])", "$1");
    }

    /**
     * Where the words first stand in the text, ignoring case, as a place in the text itself. Lowering the text first
     * would not do: some letters, such as İ, grow longer when lowered and the place would no longer fit the text.
     */
    public static int indexIgnoringCase(String text, String words) {
        for (int at = 0; at + words.length() <= text.length(); at++)
            if (text.regionMatches(true, at, words, 0, words.length())) return at;
        return -1;
    }
}

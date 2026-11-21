package xyz.goraebap.cowork.module.file;

import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The files a document written in the editor shows in its text. It keeps them as Markdown links to
 * {@code attachment:<id>}: {@code ![사진.png](attachment:…)} for a picture shown in place and
 * {@code [자료.pdf](attachment:…)} for a file block. The id is the owner's attachment, which keeps its upload's id.
 */
public final class DocumentFiles {
    private static final Pattern LINK = Pattern.compile(
            "\\]\\(attachment:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\\)");

    private DocumentFiles() {}

    /** The files the text points at, in the order it first does. */
    public static Set<UUID> referencedIn(String markdown) {
        Set<UUID> ids = new LinkedHashSet<>();
        if (markdown == null) return ids;
        Matcher matcher = LINK.matcher(markdown);
        while (matcher.find()) ids.add(UUID.fromString(matcher.group(1)));
        return ids;
    }

    /** The text pointing at the new ids instead of the old ones they were copied from; other links stay. */
    public static String repoint(String markdown, Map<UUID, UUID> newIds) {
        if (markdown == null || newIds.isEmpty()) return markdown;
        return LINK.matcher(markdown).replaceAll(match -> {
            var to = newIds.get(UUID.fromString(match.group(1)));
            return Matcher.quoteReplacement(to == null ? match.group() : "](attachment:" + to + ")");
        });
    }
}

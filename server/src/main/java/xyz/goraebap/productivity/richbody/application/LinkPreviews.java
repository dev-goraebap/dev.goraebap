package xyz.goraebap.productivity.richbody.application;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * What a link card in a body shows of the page it points to (링크 카드): the title, description and picture the page
 * names in its own metadata. The page is read by this server, never by the reader's browser, and only a public HTTPS
 * address is read (PageReader). A page that cannot be read still gives a card of its address alone, so a body never
 * breaks on a dead link. It touches no table and waits on another site, so it is a component, not a transactional
 * service: no database transaction is held while the page answers.
 */
@Component
@RequiredArgsConstructor
public class LinkPreviews {
    /** How long a page's answer is kept; a card is drawn on every read of a body, the page changes rarely. */
    static final Duration KEPT = Duration.ofHours(6);

    static final int CACHE_SIZE = 1000;
    static final int TITLE_MAX = 200;
    static final int DESCRIPTION_MAX = 300;
    static final int ADDRESS_MAX = 2000;

    private static final Pattern META = Pattern.compile("<meta\\s[^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Pattern ATTRIBUTE =
            Pattern.compile("([a-zA-Z:-]+)\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s\"'>]+))");
    private static final Pattern TITLE =
            Pattern.compile("<title[^>]*>(.*?)</title>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern ENTITY = Pattern.compile("&(#x?[0-9a-fA-F]+|[a-zA-Z]+);");
    private static final Map<String, String> ENTITIES =
            Map.of("amp", "&", "lt", "<", "gt", ">", "quot", "\"", "apos", "'", "nbsp", " ");

    public record LinkPreview(String url, String site, String title, String description, String image) {}

    private record Kept(LinkPreview preview, Instant until) {}

    private final PageReader pageReader;
    private final Clock clock;
    private final Map<String, Kept> cache = Collections.synchronizedMap(new LinkedHashMap<>(64, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, Kept> eldest) {
            return size() > CACHE_SIZE;
        }
    });

    public LinkPreview preview(String address) {
        URI uri = parse(address).orElseThrow(RichBodyErrorCode.RICH_BODY_LINK_INVALID::raise);
        String key = uri.toString();
        Instant now = clock.instant();
        Kept kept = cache.get(key);
        if (kept != null && kept.until().isAfter(now)) return kept.preview();
        LinkPreview preview = pageReader
                .read(uri)
                .map(page -> read(page.address(), page.html(), key))
                .orElseGet(() -> new LinkPreview(key, uri.getHost(), null, null, null));
        cache.put(key, new Kept(preview, now.plus(KEPT)));
        return preview;
    }

    /** An absolute HTTPS address without sign-in details, or nothing. */
    static Optional<URI> parse(String address) {
        if (address == null || address.isBlank() || address.length() > ADDRESS_MAX) return Optional.empty();
        try {
            URI uri = new URI(address.strip()).normalize();
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getRawUserInfo() != null)
                return Optional.empty();
            return Optional.of(uri);
        } catch (URISyntaxException malformed) {
            return Optional.empty();
        }
    }

    /** Reads the card out of a page's markup; page is where the markup really came from, after redirects. */
    static LinkPreview read(URI page, String html, String asked) {
        String title = null, description = null, image = null, site = null, plainDescription = null;
        Matcher metas = META.matcher(html);
        while (metas.find()) {
            String name = null, content = null;
            Matcher attributes = ATTRIBUTE.matcher(metas.group());
            while (attributes.find()) {
                String value = attributes.group(2) != null
                        ? attributes.group(2)
                        : attributes.group(3) != null ? attributes.group(3) : attributes.group(4);
                switch (attributes.group(1).toLowerCase(Locale.ROOT)) {
                    case "property", "name" -> name = value.toLowerCase(Locale.ROOT);
                    case "content" -> content = value;
                    default -> {}
                }
            }
            if (name == null || content == null || content.isBlank()) continue;
            switch (name) {
                case "og:title" -> title = content;
                case "twitter:title" -> title = title == null ? content : title;
                case "og:description" -> description = content;
                case "twitter:description" -> description = description == null ? content : description;
                case "description" -> plainDescription = content;
                case "og:image", "og:image:secure_url" -> image = image == null ? content : image;
                case "twitter:image", "twitter:image:src" -> image = image == null ? content : image;
                case "og:site_name" -> site = content;
                default -> {}
            }
        }
        if (title == null) {
            Matcher found = TITLE.matcher(html);
            if (found.find()) title = found.group(1);
        }
        if (description == null) description = plainDescription;
        return new LinkPreview(
                asked,
                site == null ? page.getHost() : clip(text(site), TITLE_MAX),
                clip(text(title), TITLE_MAX),
                clip(text(description), DESCRIPTION_MAX),
                picture(page, image));
    }

    /** The picture's absolute HTTPS address; anything else (plain HTTP, data, a broken address) gives no picture. */
    private static String picture(URI page, String image) {
        if (image == null) return null;
        try {
            URI resolved = page.resolve(new URI(text(image).replace(" ", "%20")));
            return "https".equalsIgnoreCase(resolved.getScheme())
                            && resolved.getHost() != null
                            && resolved.toString().length() <= ADDRESS_MAX
                    ? resolved.toString()
                    : null;
        } catch (URISyntaxException | IllegalArgumentException malformed) {
            return null;
        }
    }

    /** Markup text as plain text: entities read, tags and runs of space dropped. */
    private static String text(String raw) {
        if (raw == null) return null;
        String decoded = ENTITY.matcher(raw.replaceAll("<[^>]*>", " ")).replaceAll(found -> {
            String name = found.group(1);
            try {
                if (name.startsWith("#x") || name.startsWith("#X"))
                    return Matcher.quoteReplacement(Character.toString(Integer.parseInt(name.substring(2), 16)));
                if (name.startsWith("#"))
                    return Matcher.quoteReplacement(Character.toString(Integer.parseInt(name.substring(1))));
            } catch (IllegalArgumentException unknown) {
                return Matcher.quoteReplacement(found.group());
            }
            return Matcher.quoteReplacement(ENTITIES.getOrDefault(name.toLowerCase(Locale.ROOT), found.group()));
        });
        String plain = decoded.replaceAll("\\s+", " ").strip();
        return plain.isEmpty() ? null : plain;
    }

    private static String clip(String value, int max) {
        return value == null || value.length() <= max
                ? value
                : value.substring(0, max - 1).stripTrailing() + "…";
    }
}

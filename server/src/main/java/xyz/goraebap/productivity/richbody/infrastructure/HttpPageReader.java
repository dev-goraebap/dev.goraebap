package xyz.goraebap.productivity.richbody.infrastructure;

import java.io.IOException;
import java.io.InputStream;
import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import xyz.goraebap.productivity.richbody.application.PageReader;

/**
 * Reads a page over HTTPS for a link card. A member chooses the address, so this server must not be made to call
 * inside its own network: only port 443 of a host whose every address is public is called, each redirect is checked
 * the same way (and followed by hand, at most MAX_HOPS), the wait is short and only the start of an HTML answer is
 * read. Nothing of ours (cookies, tokens) goes with the request.
 */
@Slf4j
@Component
class HttpPageReader implements PageReader {
    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    private static final int MAX_HOPS = 3;
    /** Metadata sits in the head; this much of the page is enough and bounds what a huge answer costs. */
    private static final int MAX_BYTES = 512 * 1024;

    private static final Pattern CHARSET =
            Pattern.compile("charset\\s*=\\s*[\"']?([\\w.:-]+)", Pattern.CASE_INSENSITIVE);

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(TIMEOUT)
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    @Override
    public Optional<Page> read(URI address) {
        URI current = address;
        try {
            for (int hop = 0; hop <= MAX_HOPS; hop++) {
                if (!isPublic(current)) return Optional.empty();
                var request = HttpRequest.newBuilder(current)
                        .timeout(TIMEOUT)
                        .header("Accept", "text/html,application/xhtml+xml")
                        .header("Accept-Language", "ko,en;q=0.8")
                        .header("User-Agent", "cowork-link-preview/1.0")
                        .GET()
                        .build();
                HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
                try (InputStream body = response.body()) {
                    int status = response.statusCode();
                    if (status >= 300 && status < 400) {
                        var location = response.headers().firstValue("Location");
                        if (location.isEmpty()) return Optional.empty();
                        current = current.resolve(location.get());
                        continue;
                    }
                    String type = response.headers().firstValue("Content-Type").orElse("");
                    if (status != 200 || !type.toLowerCase(Locale.ROOT).contains("html")) return Optional.empty();
                    byte[] start = body.readNBytes(MAX_BYTES);
                    return Optional.of(new Page(current, new String(start, charset(type, start))));
                }
            }
            return Optional.empty();
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } catch (IOException | IllegalArgumentException failure) {
            log.debug("link preview failed for host {}: {}", address.getHost(), failure.toString());
            return Optional.empty();
        }
    }

    /** HTTPS on the default port, to a host all of whose addresses are on the public internet. */
    static boolean isPublic(URI address) {
        if (!"https".equalsIgnoreCase(address.getScheme()) || address.getHost() == null) return false;
        if (address.getPort() != -1 && address.getPort() != 443) return false;
        if (address.getRawUserInfo() != null) return false;
        try {
            InetAddress[] resolved = InetAddress.getAllByName(address.getHost());
            if (resolved.length == 0) return false;
            for (InetAddress one : resolved) if (!isPublic(one)) return false;
            return true;
        } catch (UnknownHostException unknown) {
            return false;
        }
    }

    static boolean isPublic(InetAddress address) {
        if (address.isAnyLocalAddress()
                || address.isLoopbackAddress()
                || address.isLinkLocalAddress()
                || address.isSiteLocalAddress()
                || address.isMulticastAddress()) return false;
        byte[] bytes = address.getAddress();
        if (address instanceof Inet4Address) {
            int first = bytes[0] & 0xff, second = bytes[1] & 0xff;
            // 0.0.0.0/8, shared address space 100.64.0.0/10, benchmarking 198.18.0.0/15, reserved 240.0.0.0/4.
            return first != 0
                    && !(first == 100 && second >= 64 && second <= 127)
                    && !(first == 198 && (second == 18 || second == 19))
                    && first < 240;
        }
        if (address instanceof Inet6Address) {
            // Unique local fc00::/7; and an IPv4 address written inside IPv6 is judged as that IPv4 address.
            if ((bytes[0] & 0xfe) == 0xfc) return false;
            boolean mapped = true;
            for (int index = 0; index < 10; index++) mapped &= bytes[index] == 0;
            boolean compatible = mapped && bytes[10] == 0 && bytes[11] == 0;
            mapped &= (bytes[10] & 0xff) == 0xff && (bytes[11] & 0xff) == 0xff;
            // NAT64 64:ff9b::/96 carries an IPv4 address in its last four bytes too.
            boolean nat64 = bytes[0] == 0
                    && (bytes[1] & 0xff) == 0x64
                    && (bytes[2] & 0xff) == 0xff
                    && (bytes[3] & 0xff) == 0x9b;
            if (mapped || compatible || nat64) {
                try {
                    return isPublic(InetAddress.getByAddress(new byte[] {bytes[12], bytes[13], bytes[14], bytes[15]}));
                } catch (UnknownHostException impossible) {
                    return false;
                }
            }
        }
        return true;
    }

    /** The charset the answer names, else the one the page's own meta names, else UTF-8. */
    private static Charset charset(String contentType, byte[] start) {
        for (String source : new String[] {
            contentType, new String(start, 0, Math.min(start.length, 4096), StandardCharsets.ISO_8859_1)
        }) {
            Matcher named = CHARSET.matcher(source);
            if (named.find()) {
                try {
                    return Charset.forName(named.group(1));
                } catch (IllegalArgumentException unknown) {
                    // fall through to the next source
                }
            }
        }
        return StandardCharsets.UTF_8;
    }
}

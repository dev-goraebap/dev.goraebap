package xyz.goraebap.cowork.module.file.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class HtmlEmbedsTest {
    private static final Instant NOW = Instant.parse("2026-11-10T00:00:00Z");

    private static HtmlEmbeds at(Instant instant, String secret) {
        return new HtmlEmbeds(secret, Clock.fixed(instant, ZoneOffset.UTC));
    }

    private static String[] parts(HtmlEmbeds embeds, String storageKey) {
        String[] path = embeds.link(storageKey).getPath().split("/");
        return new String[] {path[path.length - 2], path[path.length - 1]};
    }

    @Test
    void 만든_링크는_만료_전까지_그_파일을_가리킨다() {
        var embeds = at(NOW, "secret");
        String[] link = parts(embeds, "wiki/2026/파일 이름.html");

        assertThat(embeds.storageKey(link[0], link[1])).contains("wiki/2026/파일 이름.html");
        assertThat(at(NOW.plus(Duration.ofMinutes(59)), "secret").storageKey(link[0], link[1]))
                .isPresent();
        assertThat(at(NOW.plus(HtmlEmbeds.TTL).plus(HtmlEmbeds.STEP), "secret").storageKey(link[0], link[1]))
                .isEmpty();
    }

    @Test
    void 서명이_다르거나_다른_파일로_바꾼_링크는_열리지_않는다() {
        var embeds = at(NOW, "secret");
        String[] link = parts(embeds, "wiki/a.html");
        String[] other = parts(embeds, "wiki/b.html");

        assertThat(embeds.storageKey(link[0], other[1])).isEmpty();
        assertThat(at(NOW, "another").storageKey(link[0], link[1])).isEmpty();
        assertThat(embeds.storageKey("9999999999.forged", link[1])).isEmpty();
        assertThat(embeds.storageKey("nonsense", link[1])).isEmpty();
    }
}

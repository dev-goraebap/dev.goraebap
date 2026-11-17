package xyz.goraebap.module.workspace.richbody.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.URI;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import xyz.goraebap.shared.error.BusinessException;

class LinkPreviewsTest {
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-11-10T00:00:00Z"), ZoneOffset.UTC);

    @Test
    void 페이지의_메타데이터에서_제목_설명_사진을_읽는다() {
        String html = """
                <html><head><title>plain &amp; title</title>
                <meta property="og:title" content="큰 제목 &quot;인용&quot;">
                <meta content='설명 글' name='description'>
                <meta property="og:image" content="/static/cover.png">
                <meta property="og:site_name" content="사이트">
                </head></html>""";

        var preview = LinkPreviews.read(URI.create("https://example.com/a/b"), html, "https://example.com/a/b");

        assertThat(preview.title()).isEqualTo("큰 제목 \"인용\"");
        assertThat(preview.description()).isEqualTo("설명 글");
        assertThat(preview.image()).isEqualTo("https://example.com/static/cover.png");
        assertThat(preview.site()).isEqualTo("사이트");
    }

    @Test
    void 메타데이터가_없으면_title과_호스트를_쓰고_https가_아닌_사진은_버린다() {
        String html = "<title>\n  그냥 제목 </title><meta property=\"og:image\" content=\"http://example.com/x.png\">";

        var preview = LinkPreviews.read(URI.create("https://example.com/"), html, "https://example.com/");

        assertThat(preview.title()).isEqualTo("그냥 제목");
        assertThat(preview.site()).isEqualTo("example.com");
        assertThat(preview.description()).isNull();
        assertThat(preview.image()).isNull();
    }

    @Test
    void https가_아니거나_로그인_정보가_든_주소는_거절한다() {
        var previews = new LinkPreviews(address -> Optional.empty(), CLOCK);

        for (String address :
                new String[] {"http://example.com/", "javascript:alert(1)", "https://a:b@example.com/", ""})
            assertThatThrownBy(() -> previews.preview(address)).isInstanceOf(BusinessException.class);
    }

    @Test
    void 읽지_못한_페이지는_주소만_있는_카드가_되고_답은_한동안_다시_묻지_않는다() {
        var asked = new AtomicInteger();
        var previews = new LinkPreviews(
                address -> {
                    asked.incrementAndGet();
                    return Optional.empty();
                },
                CLOCK);

        var first = previews.preview("https://example.com/missing");
        previews.preview("https://example.com/missing");

        assertThat(first.site()).isEqualTo("example.com");
        assertThat(first.title()).isNull();
        assertThat(asked).hasValue(1);
    }
}

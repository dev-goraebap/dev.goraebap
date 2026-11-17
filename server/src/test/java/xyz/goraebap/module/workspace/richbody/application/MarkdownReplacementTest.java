package xyz.goraebap.module.workspace.richbody.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import xyz.goraebap.module.workspace.richbody.RichBodyMarkdown;

class MarkdownReplacementTest {
    @Test
    void printSettingsSurviveMarkdownReplacement() {
        var block = Map.<String, Object>of(
                "type",
                "paragraph",
                "attrs",
                Map.of(
                        "blockId",
                        "print-block",
                        "printBreakBefore",
                        true,
                        "printKeepWithNext",
                        true,
                        "printKeepTogether",
                        true),
                "content",
                List.of(Map.of("type", "text", "text", "다음 쪽에서 시작")));
        var current = Map.<String, Object>of(
                "type", "doc", "attrs", Map.of("printStartOnNewPage", true), "content", List.of(block));
        String markdown = RichBodyMarkdown.toMarkdown(current);
        assertThat(markdown).contains("<!-- block:print-block -->");
        var replaced = MarkdownReplacement.restore(MarkdownBody.toDocument(markdown + "\n\n추가 문단"), current, List.of());
        assertThat(MarkdownReplacement.attrs(replaced)).containsEntry("printStartOnNewPage", true);
        assertThat(MarkdownReplacement.children(replaced).getFirst()).isEqualTo(block);
    }

    @Test
    void keepsThePageSetupOfTheDocument() {
        var setup = Map.<String, Object>of("paper", "A5", "orientation", "landscape");
        var current = Map.<String, Object>of(
                "type",
                "doc",
                "attrs",
                Map.of("pageSetup", setup),
                "content",
                List.of(Map.of("type", "paragraph", "content", List.of(Map.of("type", "text", "text", "본문")))));
        var replaced = MarkdownReplacement.restore(MarkdownBody.toDocument("새 본문"), current, List.of());
        assertThat(MarkdownReplacement.attrs(replaced)).containsEntry("pageSetup", setup);
    }

    @Test
    void detailsInFencedCodeDoNotCloseTheSurroundingToggle() {
        var doc = MarkdownBody.toDocument(
                "<details>\n<summary>제목</summary>\n\n```html\n</details>\n```\n\n뒤 내용\n\n</details>");
        var toggle = MarkdownReplacement.children(doc).getFirst();
        var body = MarkdownReplacement.children(
                MarkdownReplacement.children(toggle).getLast());
        assertThat(body.stream().map(n -> n.get("type"))).containsExactly("codeBlock", "paragraph");
        assertThat(MarkdownBody.toDocument(RichBodyMarkdown.toMarkdown(doc))).isEqualTo(doc);
    }

    @Test
    void togglesAndAttachmentsInsideQuotesAndListsKeepTheirContent() {
        var doc = MarkdownBody.toDocument(
                "> <details>\n> <summary>인용 토글</summary>\n>\n> 내용\n>\n> </details>\n\n- ![사진](attachment:00000000-0000-0000-0000-000000000001)");
        String markdown = RichBodyMarkdown.toMarkdown(doc);
        assertThat(markdown).contains("> 내용", "![사진](attachment:");
        assertThat(MarkdownBody.toDocument(markdown)).isEqualTo(doc);
    }

    @Test
    void markdownOnlyDraftsNeverContainUnresolvablePreservationMarkers() {
        var doc = Map.<String, Object>of(
                "type",
                "doc",
                "content",
                List.of(Map.of(
                        "type",
                        "paragraph",
                        "attrs",
                        Map.of("textAlign", "center"),
                        "content",
                        List.of(Map.of("type", "text", "text", "본문")))));
        assertThat(RichBodyMarkdown.toMarkdown(doc)).contains("<!-- block:");
        assertThat(RichBodyMarkdown.toDraftMarkdown(doc)).isEqualTo("본문");
    }

    @Test
    void opaqueLayoutIsRestoredAndOmissionRequiresExplicitDrop() {
        var columns = Map.<String, Object>of(
                "type",
                "columns",
                "attrs",
                Map.of("blockId", "layout"),
                "content",
                List.of(Map.of("type", "column", "content", List.of(Map.of("type", "paragraph")))));
        var current = Map.<String, Object>of("type", "doc", "content", List.of(columns));
        String markdown = RichBodyMarkdown.toMarkdown(current);
        assertThat(markdown).isEqualTo("<!-- block:layout -->");
        var saved = MarkdownReplacement.restore(MarkdownBody.toDocument(markdown + "\n\n새 글"), current, List.of());
        assertThat(MarkdownReplacement.children(saved).getFirst()).isEqualTo(columns);
        assertThatThrownBy(() -> MarkdownReplacement.restore(MarkdownBody.toDocument("지워짐"), current, List.of()))
                .hasMessageContaining("layout")
                .hasMessageContaining("columns");
        assertThat(MarkdownReplacement.restore(MarkdownBody.toDocument("지워짐"), current, List.of("layout")))
                .isEqualTo(MarkdownBody.toDocument("지워짐"));
        assertThatThrownBy(() -> MarkdownReplacement.restore(
                        MarkdownBody.toDocument(markdown + "\n\n" + markdown), current, List.of()))
                .hasMessageContaining("중복");
        assertThatThrownBy(() -> MarkdownReplacement.restore(
                        MarkdownBody.toDocument("<!-- block:foreign -->"), current, List.of("layout")))
                .hasMessageContaining("보존 표시");
    }

    @Test
    void legacyIdentityIsStableAndMediaKeepsItsDisplayAttributes() {
        var legacy = Map.<String, Object>of("type", "columns");
        assertThat(RichBodyMarkdown.blockId(legacy))
                .startsWith("legacy-")
                .isEqualTo(RichBodyMarkdown.blockId(Map.of("type", "columns")));
        String source = "attachment:00000000-0000-0000-0000-000000000001";
        var media = Map.<String, Object>of(
                "type",
                "media",
                "attrs",
                Map.of("src", source, "name", "이전", "mime", "image/jpeg", "width", 50, "blockId", "picture"));
        var current = Map.<String, Object>of("type", "doc", "content", List.of(media));
        var saved = MarkdownReplacement.restore(MarkdownBody.toDocument("![새 설명](" + source + ")"), current, List.of());
        assertThat(MarkdownReplacement.attrs(MarkdownReplacement.children(saved).getFirst()))
                .containsEntry("width", 50)
                .containsEntry("mime", "image/jpeg")
                .containsEntry("name", "새 설명")
                .containsEntry("blockId", "picture");
    }

    @Test
    void unsupportedInlineAndAlignmentUsePreservationRatherThanFlattening() {
        var aligned = Map.<String, Object>of("type", "paragraph", "attrs", Map.of("textAlign", "center"));
        var math = Map.<String, Object>of(
                "type", "paragraph", "content", List.of(Map.of("type", "inlineMath", "attrs", Map.of("source", "x"))));
        assertThat(RichBodyMarkdown.needsPreservation(aligned)).isTrue();
        assertThat(RichBodyMarkdown.needsPreservation(math)).isTrue();
        assertThat(RichBodyMarkdown.needsPreservation(Map.of("type", "callout", "attrs", Map.of("tone", "success"))))
                .isTrue();
        assertThat(RichBodyMarkdown.needsPreservation(Map.of("type", "callout")))
                .isTrue();
    }

    @Test
    void attachmentsAutolinksAndNestedTogglesRoundTrip() {
        String markdown = """
                <details open>
                <summary>**제목**</summary>

                내용

                <details><summary>안쪽</summary>안쪽 내용</details>

                </details>

                <https://example.com>

                ![사진](attachment:00000000-0000-0000-0000-000000000001)
                [파일](attachment:00000000-0000-0000-0000-000000000002)
                """;
        var doc = MarkdownBody.toDocument(markdown);
        var blocks = MarkdownReplacement.children(doc);
        assertThat(blocks.stream().map(n -> n.get("type"))).containsExactly("toggle", "webEmbed", "media", "media");
        assertThat(MarkdownReplacement.attrs(blocks.getFirst())).containsEntry("open", true);
        String exported = RichBodyMarkdown.toMarkdown(doc);
        assertThat(MarkdownBody.toDocument(exported)).isEqualTo(doc);
        assertThat(MarkdownReplacement.children(MarkdownBody.toDocument("글 속 ![사진](attachment:a) 은 링크"))
                        .getFirst()
                        .get("type"))
                .isEqualTo("paragraph");
        assertThat(MarkdownReplacement.children(
                                MarkdownBody.toDocument("```html\n<details><summary>x</summary>y</details>\n```"))
                        .getFirst()
                        .get("type"))
                .isEqualTo("codeBlock");
    }
}

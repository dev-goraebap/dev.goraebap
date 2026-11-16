package xyz.goraebap.workspace.richbody.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import xyz.goraebap.workspace.richbody.RichBodyMarkdown;

/**
 * A body read as Markdown for agents (RichBodyMarkdown) and written back from Markdown (MarkdownBody): what Markdown has
 * words for comes back the same, so an agent that reads a body, changes a line and writes it all keeps the rest.
 */
class RichBodyMarkdownTest {
    @Test
    void markdownAgentsWriteReadsBackTheSame() {
        String markdown = """
                ## 배경

                API 문서가 **오래됐다**. `openapi.json`과 [링크](https://example.com)\\
                다음 줄

                - [ ] 엔드포인트 정리
                - [x] 예시 갱신
                  - 하위 항목

                1. 첫째
                2. 둘째

                > [!WARNING]
                > 지우기 전에 확인한다

                > 인용

                | 열1 | 열2 |
                | --- | --- |
                | a | b \\| c |

                ```java
                int a = 1;
                ```

                ```mermaid
                flowchart LR
                  A-->B
                ```

                ---""";
        assertThat(RichBodyMarkdown.toMarkdown(MarkdownBody.toDocument(markdown)))
                .isEqualTo(markdown);
    }

    @Test
    void blocksWithoutMarkdownWordsAreSpelledOutAndTextIsEscaped() {
        Map<String, Object> doc = Map.of(
                "type",
                "doc",
                "content",
                List.of(
                        Map.of(
                                "type",
                                "toggle",
                                "content",
                                List.of(
                                        Map.of("type", "toggleSummary", "content", List.of(text("접힌 제목"))),
                                        Map.of(
                                                "type",
                                                "toggleBody",
                                                "content",
                                                List.of(
                                                        Map.of(
                                                                "type",
                                                                "paragraph",
                                                                "content",
                                                                List.of(text("속 내용"))))))),
                        Map.of("type", "paragraph", "content", List.of(text("별표 * 와 [괄호]"))),
                        Map.of(
                                "type",
                                "media",
                                "attrs",
                                Map.of(
                                        "name",
                                        "화면.png",
                                        "src",
                                        "attachment:00000000-0000-0000-0000-000000000001",
                                        "mime",
                                        "image/png"))));
        assertThat(RichBodyMarkdown.toMarkdown(doc))
                .isEqualTo(
                        "<details>\n<summary>접힌 제목</summary>\n\n속 내용\n\n</details>\n\n별표 \\* 와 \\[괄호\\]\n\n![화면.png](attachment:00000000-0000-0000-0000-000000000001)");
        assertThat(RichBodyMarkdown.toMarkdown(null)).isEmpty();
    }

    private static Map<String, Object> text(String value) {
        return Map.of("type", "text", "text", value);
    }

    @Test
    void colourMarksRoundTripAsDataColorTags() {
        String markdown = "<mark data-color=\"green\">초록 형광</mark> 그리고 <span data-color=\"red\">**빨간 굵게**</span>";
        assertThat(RichBodyMarkdown.toMarkdown(MarkdownBody.toDocument(markdown)))
                .isEqualTo(markdown);
    }
}

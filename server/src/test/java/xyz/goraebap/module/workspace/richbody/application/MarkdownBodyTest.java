package xyz.goraebap.module.workspace.richbody.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** Markdown as the body editor's JSON: the blocks and marks the editor has, the rest kept as plain text. */
class MarkdownBodyTest {
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @Test
    void headingsParagraphsAndMarksBecomeTheEditorsNodes() {
        var doc = doc("# 제목\n\n본문에 **굵게**, *기울임*, ~~취소~~, `코드`와 [링크](https://example.com)가 있다.\n둘째 줄\n\n##### 깊은 제목");
        assertThat(doc.at("/type").asText()).isEqualTo("doc");
        assertThat(doc.at("/content/0/type").asText()).isEqualTo("heading");
        assertThat(doc.at("/content/0/attrs/level").asInt()).isEqualTo(1);
        var paragraph = doc.at("/content/1/content");
        assertThat(texts(paragraph))
                .containsExactly("본문에 ", "굵게", ", ", "기울임", ", ", "취소", ", ", "코드", "와 ", "링크", "가 있다. 둘째 줄");
        assertThat(paragraph.get(1).at("/marks/0/type").asText()).isEqualTo("bold");
        assertThat(paragraph.get(3).at("/marks/0/type").asText()).isEqualTo("italic");
        assertThat(paragraph.get(5).at("/marks/0/type").asText()).isEqualTo("strike");
        assertThat(paragraph.get(7).at("/marks/0/type").asText()).isEqualTo("code");
        assertThat(paragraph.get(9).at("/marks/0/attrs/href").asText()).isEqualTo("https://example.com");
        // The editor has four heading levels.
        assertThat(doc.at("/content/2/attrs/level").asInt()).isEqualTo(4);
    }

    @Test
    void listsTasksTablesAndCodeKeepTheirShape() {
        var doc = doc("- 하나\n- 둘\n\n3. 셋\n4. 넷\n\n- [x] 끝남\n- [ ] 남음\n\n| 이름 | 값 |\n| --- | --- |\n| 가 | 1 |\n\n"
                + "```java\nint a = 1;\n```\n\n```mermaid\nflowchart LR\n  A --> B\n```\n\n---\n");
        assertThat(doc.at("/content/0/type").asText()).isEqualTo("bulletList");
        assertThat(doc.at("/content/0/content/1/content/0/content/0/text").asText())
                .isEqualTo("둘");
        assertThat(doc.at("/content/1/type").asText()).isEqualTo("orderedList");
        assertThat(doc.at("/content/1/attrs/start").asInt()).isEqualTo(3);
        assertThat(doc.at("/content/2/type").asText()).isEqualTo("taskList");
        assertThat(doc.at("/content/2/content/0/attrs/checked").asBoolean()).isTrue();
        assertThat(doc.at("/content/2/content/1/attrs/checked").asBoolean()).isFalse();
        assertThat(doc.at("/content/3/type").asText()).isEqualTo("table");
        assertThat(doc.at("/content/3/content/0/content/0/type").asText()).isEqualTo("tableHeader");
        assertThat(doc.at("/content/3/content/1/content/1/content/0/content/0/text")
                        .asText())
                .isEqualTo("1");
        assertThat(doc.at("/content/4/type").asText()).isEqualTo("codeBlock");
        assertThat(doc.at("/content/4/attrs/language").asText()).isEqualTo("java");
        assertThat(doc.at("/content/4/content/0/text").asText()).isEqualTo("int a = 1;");
        assertThat(doc.at("/content/5/type").asText()).isEqualTo("mermaidBlock");
        assertThat(doc.at("/content/5/attrs/source").asText()).isEqualTo("flowchart LR\n  A --> B");
        assertThat(doc.at("/content/6/type").asText()).isEqualTo("horizontalRule");
    }

    @Test
    void anAlertQuoteBecomesACalloutAndAPlainQuoteStaysOne() {
        var doc = doc("> [!WARNING]\n> **결정기록 보존**\n> 기록을 남긴다.\n\n> 그냥 인용\n\n<!-- 주석 -->\n");
        assertThat(doc.at("/content/0/type").asText()).isEqualTo("callout");
        assertThat(doc.at("/content/0/attrs/tone").asText()).isEqualTo("warning");
        assertThat(texts(doc.at("/content/0/content/0/content"))).containsExactly("결정기록 보존", " 기록을 남긴다.");
        assertThat(doc.at("/content/1/type").asText()).isEqualTo("blockquote");
        assertThat(doc.at("/content").size()).isEqualTo(2);
    }

    @Test
    void nothingWrittenIsOneEmptyParagraph() {
        assertThat(MarkdownBody.toDocument("  \n"))
                .isEqualTo(Map.of("type", "doc", "content", List.of(Map.of("type", "paragraph"))));
    }

    @Test
    void colourTagsBecomeHighlightAndTextColourEvenAcrossLines() {
        // 색이 문단에서 열려 목록 끝에서 닫힌다(줄을 넘는 색).
        var doc = doc("<mark data-color=\"red\">지적 사항 조치\n\n- 접속 이력 저장\n- 그 외</mark>\n\n"
                + "<span data-color=\"blue\">파란 **굵은** 글</span>과 ==노랑==, 비교 a == b");
        var first = doc.at("/content/0/content/0");
        assertThat(first.at("/text").asText()).isEqualTo("지적 사항 조치");
        assertThat(first.at("/marks/0/type").asText()).isEqualTo("highlight");
        assertThat(first.at("/marks/0/attrs/color").asText()).isEqualTo("#503631");
        var item = doc.at("/content/1/content/1/content/0/content/0");
        assertThat(item.at("/text").asText()).isEqualTo("그 외");
        assertThat(item.at("/marks/0/type").asText()).isEqualTo("highlight");
        var last = doc.at("/content/2/content");
        assertThat(texts(last)).containsExactly("파란 ", "굵은", " 글", "과 ", "노랑", ", 비교 a == b");
        assertThat(last.get(0).at("/marks/0/type").asText()).isEqualTo("textStyle");
        assertThat(last.get(0).at("/marks/0/attrs/color").asText()).isEqualTo("#80afcf");
        assertThat(last.get(1).at("/marks").size()).isEqualTo(2);
        assertThat(last.get(4).at("/marks/0/attrs/color").asText()).isEqualTo("#514a2c");
        assertThat(last.get(5).has("marks")).isFalse();
    }

    @Test
    void aColourOpenedTwiceStaysOpenUntilClosedTwice() {
        // 옛 주간보고의 실제 모양: 같은 형광펜을 겹쳐 열고, 첫 줄 끝에서 한 번, 목록 끝에서 한 번 닫는다.
        var doc = doc("<mark data-color=\"red\"><mark data-color=\"red\">조치</mark>\n*   저장\n*   그 외</mark>");
        assertThat(doc.at("/content/0/content/0/marks/0/type").asText()).isEqualTo("highlight");
        var items = doc.at("/content/1/content");
        assertThat(items.get(0).at("/content/0/content/0/marks/0/type").asText())
                .isEqualTo("highlight");
        assertThat(items.get(1).at("/content/0/content/0/text").asText()).isEqualTo("그 외");
        assertThat(items.get(1).at("/content/0/content/0/marks/0/type").asText())
                .isEqualTo("highlight");
    }

    private static JsonNode doc(String markdown) {
        return JSON.valueToTree(MarkdownBody.toDocument(markdown));
    }

    private static List<String> texts(JsonNode content) {
        var texts = new ArrayList<String>();
        for (JsonNode node : content) texts.add(node.path("text").asText());
        return texts;
    }
}

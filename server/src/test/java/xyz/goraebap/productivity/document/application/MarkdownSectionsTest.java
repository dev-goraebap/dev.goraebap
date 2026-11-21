package xyz.goraebap.productivity.document.application;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class MarkdownSectionsTest {
    @Test
    void sectionsDoNotSplitTogglesAtTheirInnerHeadings() {
        String markdown = "## 바깥\n\n<details>\n<summary>제목</summary>\n\n## 안쪽\n\n내용\n\n</details>\n\n## 다음\n\n후속";
        var sections = MarkdownSections.of(markdown);
        assertThat(sections.find("안쪽")).isEmpty();
        var outer = sections.find("바깥").orElseThrow();
        assertThat(sections.text(outer)).contains("## 안쪽", "</details>");
        assertThat(sections.replace(outer, sections.text(outer).replace("내용", "고친 내용")))
                .contains("</details>\n\n## 다음");
    }
}

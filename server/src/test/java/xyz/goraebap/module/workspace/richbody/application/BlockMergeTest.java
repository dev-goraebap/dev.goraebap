package xyz.goraebap.module.workspace.richbody.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class BlockMergeTest {
    @Test
    void blocksNewElsewhereFollowTheBlockBeforeThem() {
        // Kept: a, n (new elsewhere after a), b, c. The save knows a, b, c and puts c before b.
        var order = RichBodyService.mergedOrder(
                List.of("a", "c", "b"), List.of("a", "n", "b", "c"), Set.of("a", "n", "b", "c"), Set.of());
        assertThat(order).containsExactly("a", "n", "c", "b");
    }

    @Test
    void deletedAndUnknownBlocksGo() {
        var order = RichBodyService.mergedOrder(
                List.of("a", "gone", "b"), List.of("a", "b", "c"), Set.of("a", "b", "c"), Set.of("c"));
        assertThat(order).containsExactly("a", "b");
    }

    @Test
    void aBlockNewElsewhereAtTheStartStaysFirst() {
        var order = RichBodyService.mergedOrder(List.of("a"), List.of("n", "a"), Set.of("n", "a"), Set.of());
        assertThat(order).containsExactly("n", "a");
    }

    @Test
    void splitKeepsGivenIdsAndAssemblesInKeyOrder() {
        Map<String, Object> body = Map.of(
                "type",
                "doc",
                "content",
                List.of(Map.of("type", "paragraph"), Map.of("type", "paragraph", "attrs", Map.of("blockId", "x"))));
        var split = BodyBlocks.split(body);
        assertThat(split.attrs()).isNull();
        assertThat(split.blocks()).hasSize(2);
        assertThat(split.blocks().get(0).id()).isNotBlank();
        assertThat(split.blocks().get(1).id()).isEqualTo("x");
        assertThat(BodyBlocks.assemble(null, List.of("{\"a\":1}", "{\"b\":2}")))
                .isEqualTo("{\"content\":[{\"a\":1},{\"b\":2}],\"type\":\"doc\"}");
    }
}

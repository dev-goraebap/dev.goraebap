package xyz.goraebap.cowork.module.workspace.richbody.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class BlockKeysTest {
    @Test
    void midpointSortsBetweenItsEnds() {
        assertThat(BlockKeys.midpoint("", null)).isEqualTo("i");
        String[][] cases = {{"", "1"}, {"a", "b"}, {"a", "a1"}, {"az", "b"}, {"0001", "0002"}, {"zz", null}};
        for (String[] ends : cases) {
            String key = BlockKeys.midpoint(ends[0], ends[1]);
            assertThat(key.compareTo(ends[0])).as("%s after %s", key, ends[0]).isPositive();
            if (ends[1] != null)
                assertThat(key.compareTo(ends[1]))
                        .as("%s before %s", key, ends[1])
                        .isNegative();
            assertThat(key).doesNotEndWith("0");
        }
    }

    @Test
    void manyKeysStayShortAndOrdered() {
        var keys = BlockKeys.between("", null, 10_000);
        assertThat(keys).isSorted().doesNotHaveDuplicates();
        assertThat(keys.stream().mapToInt(String::length).max().orElseThrow()).isLessThanOrEqualTo(6);
    }

    @Test
    void repeatedInsertsAtOnePlaceKeepOrder() {
        var keys = new ArrayList<>(List.of("a", "b"));
        for (int round = 0; round < 200; round++) keys.add(1, BlockKeys.midpoint(keys.get(0), keys.get(1)));
        assertThat(keys).isSorted().doesNotHaveDuplicates();
    }

    @Test
    void assignKeepsBlocksInPlaceAndKeysOnlyNewOrMovedOnes() {
        Map<String, String> existing = new HashMap<>(Map.of("a", "1", "b", "2", "c", "3", "d", "4"));
        // d moved to the front, x new between b and c.
        var order = List.of("d", "a", "b", "x", "c");
        var assigned = BlockKeys.assign(order, existing);
        assertThat(order.stream().map(assigned::get).toList()).isSorted().doesNotHaveDuplicates();
        for (String kept : Set.of("a", "b", "c")) assertThat(assigned.get(kept)).isEqualTo(existing.get(kept));
        assertThat(assigned.get("d")).isNotEqualTo("4");
    }
}

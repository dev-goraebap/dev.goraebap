package xyz.goraebap.module.foundation.search.application;

import java.util.List;
import xyz.goraebap.module.foundation.search.SearchHit;

public final class SearchViews {
    private SearchViews() {}

    /** One kind's hits, in the kind's order; kinds with nothing found are left out. */
    public record SearchGroup(String kind, List<SearchHit> hits) {
        public SearchGroup {
            hits = List.copyOf(hits);
        }
    }

    public record SearchResult(List<SearchGroup> groups) {
        public SearchResult {
            groups = List.copyOf(groups);
        }
    }
}

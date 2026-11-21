package xyz.goraebap.cowork.module.search.application;

import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.cowork.module.search.SearchSpi;
import xyz.goraebap.cowork.shared.web.CurrentUser;

/** 탐색: every kind's hits for the words, each kind as its module finds it for the member. */
@Service
@RequiredArgsConstructor
public class SearchService {
    private final List<SearchSpi> kinds;

    @Transactional(readOnly = true)
    public SearchViews.SearchResult search(CurrentUser user, SearchRequests.Search search) {
        var groups = kinds.stream()
                .sorted(Comparator.comparingInt(SearchSpi::order))
                .map(kind -> new SearchViews.SearchGroup(kind.kind(), kind.find(user, search.q(), search.size())))
                .filter(group -> !group.hits().isEmpty())
                .toList();
        return new SearchViews.SearchResult(groups);
    }
}

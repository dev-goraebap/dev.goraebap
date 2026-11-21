package xyz.goraebap.foundation.search.application;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.shared.web.CurrentUser;

/** 탐색 over what the member may see: 업무 · 문서 · 회의록 · 일정 · 공지 · 주간보고, grouped by kind. */
@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {
    private final SearchService searchService;

    @GetMapping
    public SearchViews.SearchResult search(
            @AuthenticationPrincipal CurrentUser user,
            @ParameterObject @Valid @ModelAttribute SearchRequests.Search search) {
        return searchService.search(user, search);
    }
}

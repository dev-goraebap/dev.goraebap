package xyz.goraebap.workspace.issue.application.issue;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import xyz.goraebap.foundation.search.SearchHit;
import xyz.goraebap.foundation.search.SearchSpi;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/** 탐색's 업무: the issues of the projects the member sees whose title, number or KEY-number holds the words. */
@Component
@RequiredArgsConstructor
class IssueSearch implements SearchSpi {
    private final IssueService issueService;

    @Override
    public String kind() {
        return "work-item";
    }

    @Override
    public int order() {
        return 10;
    }

    @Override
    public List<SearchHit> find(CurrentUser user, String q, int size) {
        var listing = new IssueRequests.Listing(
                null, null, null, null, null, null, null, null, q, null, null, null, null, size);
        return issueService.listAll(user, listing).items().stream()
                .map(issue -> new SearchHit(
                        issue.id().toString(),
                        issue.title(),
                        null,
                        issue.ref(),
                        "/workspace/projects/" + issue.projectKey() + "/work-items/" + issue.number()))
                .toList();
    }
}

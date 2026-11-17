package xyz.goraebap.module.workspace.document.application.document;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import xyz.goraebap.module.foundation.search.SearchHit;
import xyz.goraebap.module.foundation.search.SearchSpi;
import xyz.goraebap.module.workspace.document.domain.document.Document;
import xyz.goraebap.shared.text.TextExcerpt;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * 탐색's 문서: the pages and manuals the member sees whose title or text holds the words. Meetings and weekly reports
 * kept in 문서함 are left to their own kinds, so each is found once.
 */
@Component
@RequiredArgsConstructor
class DocumentSearch implements SearchSpi {
    private final DocumentService documentService;

    @Override
    public String kind() {
        return "document";
    }

    @Override
    public int order() {
        return 20;
    }

    @Override
    public List<SearchHit> find(CurrentUser user, String q, int size) {
        var listing = new DocumentRequests.Listing(null, null, null, null, q, null, null, null, size * 2);
        return documentService.list(user, listing).items().stream()
                .filter(document -> document.kind() == Document.Kind.PAGE || document.kind() == Document.Kind.MANUAL)
                .limit(size)
                .map(document -> new SearchHit(
                        document.id().toString(),
                        document.title(),
                        TextExcerpt.contains(document.title(), q) ? null : TextExcerpt.around(document.excerpt(), q),
                        document.projectKey() == null ? "공용" : document.projectKey(),
                        document.projectKey() == null
                                ? "/workspace/documents/" + document.id()
                                : "/workspace/projects/" + document.projectKey() + "/documents/" + document.id()))
                .toList();
    }
}

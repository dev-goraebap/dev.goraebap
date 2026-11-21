package xyz.goraebap.cowork.module.search;

import java.util.List;
import xyz.goraebap.cowork.shared.web.CurrentUser;

/**
 * One kind of thing 탐색 finds (업무, 문서, 회의록, …), as the module that keeps it finds it: only what the member may see,
 * by the same rules as that module's own list, newest first. The module implements it; 탐색 asks every kind at once.
 */
public interface SearchSpi {
    /** The kind's name in the answer (work-item, document, meeting, event, announcement, weekly-report). */
    String kind();

    /** Where the kind stands among the groups, smaller first. */
    int order();

    /** At most size of the member's things whose words hold q, newest first. */
    List<SearchHit> find(CurrentUser user, String q, int size);
}

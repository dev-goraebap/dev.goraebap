package xyz.goraebap.module.foundation.mcp;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * A module's part of changes_since: what of its own changed after a moment, as
 * the compact rows its tools list, each with change created or changed. An agent starting a session asks for what moved
 * since its last cursor instead of reading everything again.
 */
public interface McpChangeSource {
    /** The name the changes stand under in the answer (documents, issues). */
    String kind();

    /**
     * What the member may read that was made or changed after since, the latest first, at most limit (more when there
     * were more), narrowed to one project's when project is given.
     */
    Changes changesSince(CurrentUser actor, Instant since, Instant until, String project, int limit, String cursor);

    record Changes(List<Map<String, Object>> items, String nextCursor) {
        public Changes {
            items = List.copyOf(items);
        }
    }
}

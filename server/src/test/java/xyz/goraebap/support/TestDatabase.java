package xyz.goraebap.support;

import java.util.Set;
import org.springframework.jdbc.core.JdbcTemplate;

/** The test database emptied between tests, the way PostgreSQL's TRUNCATE ... CASCADE did before SQLite. */
public final class TestDatabase {
    /** Flyway's history and the row the schema itself puts in stay. */
    private static final Set<String> KEPT = Set.of("flyway_schema_history", "iam_permission_lock");

    private TestDatabase() {}

    /**
     * Every table emptied in one go; foreign keys are not checked until it is done. The workspace's work item types come
     * back as V38 seeds them, as every work item needs one.
     */
    public static void clear(JdbcTemplate jdbc) {
        var tables = jdbc.queryForList(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'", String.class);
        jdbc.execute("PRAGMA foreign_keys = OFF");
        try {
            for (String table : tables) if (!KEPT.contains(table)) jdbc.execute("DELETE FROM \"" + table + "\"");
        } finally {
            jdbc.execute("PRAGMA foreign_keys = ON");
        }
        jdbc.update("INSERT INTO work_item_type (code, name, icon, color, \"position\", is_default) VALUES "
                + "('TASK', '작업', 'checklist', '#95959f', 0, 1), ('BUG', '버그', 'bug', '#eb5757', 1, 0), "
                + "('FEATURE', '기능', 'idea', '#f2994a', 2, 0), ('EPIC', '에픽', 'epic', '#5e6ad2', 3, 0), "
                + "('STORY', '스토리', 'document', '#4cb782', 4, 0)");
    }
}

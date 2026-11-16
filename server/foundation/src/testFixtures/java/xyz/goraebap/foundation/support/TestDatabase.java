package xyz.goraebap.foundation.support;

import java.util.Set;
import org.springframework.jdbc.core.JdbcTemplate;

/** The test database emptied between tests, the way PostgreSQL's TRUNCATE ... CASCADE did before SQLite. */
public final class TestDatabase {
    /** The row the schema itself puts in stays, as does each subproject's record of its migrations. */
    private static final Set<String> KEPT = Set.of("iam_permission_lock");

    private TestDatabase() {}

    /**
     * Every table emptied in one go; foreign keys are not checked until it is done.
     */
    public static void clear(JdbcTemplate jdbc) {
        var tables = jdbc.queryForList(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'", String.class);
        jdbc.execute("PRAGMA foreign_keys = OFF");
        try {
            for (String table : tables)
                if (!KEPT.contains(table) && !table.startsWith("flyway_")) jdbc.execute("DELETE FROM \"" + table + "\"");
        } finally {
            jdbc.execute("PRAGMA foreign_keys = ON");
        }
    }
}

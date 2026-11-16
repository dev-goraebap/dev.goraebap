package xyz.goraebap.workspace.support;

import java.util.Set;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import xyz.goraebap.foundation.shared.persistence.SubprojectDatabase;
import xyz.goraebap.workspace.WorkspaceDatabaseConfig;

/** The workspace's test database: a JdbcTemplate over its own file, and the file emptied between tests. */
@Configuration(proxyBeanMethods = false)
public class WorkspaceTestDatabase {
    private static final Set<String> KEPT = Set.of("flyway_schema_history");

    /** Named, never the default one: the plain JdbcTemplate stays the foundation's. */
    @Bean(defaultCandidate = false)
    @Qualifier(WorkspaceDatabaseConfig.DSL)
    JdbcTemplate workspaceJdbc(@Qualifier(WorkspaceDatabaseConfig.DSL) SubprojectDatabase database) {
        return new JdbcTemplate(database.dataSource());
    }

    /** Every table emptied; the work item types come back as the schema seeds them, as every work item needs one. */
    public static void clear(JdbcTemplate ws) {
        var tables = ws.queryForList(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'", String.class);
        ws.execute("PRAGMA foreign_keys = OFF");
        try {
            for (String table : tables) if (!KEPT.contains(table)) ws.execute("DELETE FROM \"" + table + "\"");
        } finally {
            ws.execute("PRAGMA foreign_keys = ON");
        }
        ws.update("INSERT INTO work_item_type (code, name, icon, color, \"position\", is_default) VALUES "
                + "('TASK', '작업', 'checklist', '#95959f', 0, 1), ('BUG', '버그', 'bug', '#eb5757', 1, 0), "
                + "('FEATURE', '기능', 'idea', '#f2994a', 2, 0), ('EPIC', '에픽', 'epic', '#5e6ad2', 3, 0), "
                + "('STORY', '스토리', 'document', '#4cb782', 4, 0)");
    }
}

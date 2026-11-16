package xyz.goraebap.workspace.support;

import org.springframework.jdbc.core.JdbcTemplate;

/** What the workspace's schema seeds, put back after the test database is emptied. */
public final class WorkspaceTestDatabase {
    private WorkspaceTestDatabase() {}

    /** The work item types come back as the schema seeds them, as every work item needs one. */
    public static void seed(JdbcTemplate jdbc) {
        jdbc.update("INSERT INTO work_item_type (code, name, icon, color, \"position\", is_default) VALUES "
                + "('TASK', '작업', 'checklist', '#95959f', 0, 1), ('BUG', '버그', 'bug', '#eb5757', 1, 0), "
                + "('FEATURE', '기능', 'idea', '#f2994a', 2, 0), ('EPIC', '에픽', 'epic', '#5e6ad2', 3, 0), "
                + "('STORY', '스토리', 'document', '#4cb782', 4, 0)");
    }
}

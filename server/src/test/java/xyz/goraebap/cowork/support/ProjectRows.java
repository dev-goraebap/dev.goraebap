package xyz.goraebap.cowork.support;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Projects put straight into the test database with their current key, for the office's events, minutes and overtime
 * to name. Projects are made in the projects area, which these tests do not go through.
 */
public final class ProjectRows {
    private ProjectRows() {}

    public static UUID insert(JdbcTemplate jdbc, String key, String name) {
        return insert(jdbc, key, name, null);
    }

    /** A project with the description its minutes are summarized against, or none. */
    public static UUID insert(JdbcTemplate jdbc, String key, String name, String description) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO project(project_id,name,description) VALUES (?,?,?)", id, name, description);
        jdbc.update("INSERT INTO project_key(prefix,project_id,is_current) VALUES (?,?,1)", key, id);
        return id;
    }
}

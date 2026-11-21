package xyz.goraebap.support;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Project members put straight into the test database: only members see a project and what is in it, as viewers,
 * editors or administrators (cowork-projects 권한). The project is named by a key it has.
 */
public final class ProjectMembers {
    private ProjectMembers() {}

    public static void join(JdbcTemplate jdbc, String key, UUID user, String role) {
        jdbc.update(
                "INSERT INTO project_member(project_id,user_id,role) SELECT project_id, ?, ? FROM project_key WHERE prefix=?"
                        + " ON CONFLICT(project_id,user_id) DO UPDATE SET role=excluded.role",
                user,
                role,
                key);
    }

    /** The members join the project as editors, who write its issues and documents. */
    public static void editors(JdbcTemplate jdbc, String key, UUID... users) {
        for (UUID user : users) join(jdbc, key, user, "EDITOR");
    }
}

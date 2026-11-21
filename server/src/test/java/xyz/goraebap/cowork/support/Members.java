package xyz.goraebap.cowork.support;

import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import xyz.goraebap.cowork.shared.persistence.InstantTextBinding;

/**
 * Members put straight into the test database as registration leaves them: who they are in users (made, or completed
 * when the test opened the account first). A member made here without an account cannot sign in until the test lets
 * them.
 */
public final class Members {
    private Members() {}

    public static Member member(UUID id, String name, String email) {
        return new Member(id, name, email, "ACTIVE", Instant.now());
    }

    public static void insert(JdbcTemplate jdbc, Member member) {
        jdbc.update(
                "INSERT INTO users(user_id,email,name,status,invited_at,is_active) VALUES (?,?,?,?,?,false)"
                        + " ON CONFLICT(user_id) DO UPDATE SET name=excluded.name, status=excluded.status,"
                        + " invited_at=excluded.invited_at",
                member.id(),
                member.email(),
                member.name(),
                member.status(),
                InstantTextBinding.text(member.invitedAt()));
    }

    public record Member(UUID id, String name, String email, String status, Instant invitedAt) {
        public Member status(String status) {
            return new Member(id, name, email, status, invitedAt);
        }

        public Member invitedAt(Instant invitedAt) {
            return new Member(id, name, email, status, invitedAt);
        }
    }
}

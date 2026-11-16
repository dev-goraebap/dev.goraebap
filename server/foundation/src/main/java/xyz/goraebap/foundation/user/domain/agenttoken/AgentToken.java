package xyz.goraebap.foundation.user.domain.agenttoken;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.foundation.shared.error.DomainRuleViolation;

/**
 * A token a member made for an agent to act as them through the MCP server: what it is for,
 * which agent uses it, how it is recognised in the list (its first characters) and its keyed hash, never the token
 * itself. It works until it expires, if it does, or until it is revoked. Its last use is kept at most once a minute, so
 * a busy agent does not write on every call.
 */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(staticName = "fromPersistence")
public class AgentToken {
    public static final int NAME_MAX = 64;
    public static final int AGENT_NAME_MAX = 64;

    /** How often the last use is written down. */
    static final Duration TOUCH_INTERVAL = Duration.ofMinutes(1);

    @EqualsAndHashCode.Include
    private final UUID id;

    private final UUID userId;
    private UUID profileId;
    private final String name;
    private final String agentName;
    private final String prefix;
    private final String hash;
    private final Instant createdAt;
    private final Instant expiresAt;
    private Instant lastUsedAt;
    private String lastUsedIp;
    private Instant revokedAt;

    /** A new token; expiresAt is null for one that lasts until it is revoked. */
    public static AgentToken create(
            UUID id,
            UUID userId,
            String name,
            String agentName,
            String prefix,
            String hash,
            Instant now,
            Instant expiresAt) {
        String validName = text(name, NAME_MAX, "토큰 이름");
        String validAgent = text(agentName, AGENT_NAME_MAX, "에이전트 이름");
        if (expiresAt != null && !expiresAt.isAfter(now)) throw new DomainRuleViolation("만료일은 지금보다 뒤여야 합니다");
        return new AgentToken(id, userId, null, validName, validAgent, prefix, hash, now, expiresAt, null, null, null);
    }

    public void connect(UUID profileId) {
        this.profileId = Objects.requireNonNull(profileId);
    }

    public boolean usable(Instant now) {
        return revokedAt == null && (expiresAt == null || now.isBefore(expiresAt));
    }

    public boolean expired(Instant now) {
        return expiresAt != null && !now.isBefore(expiresAt);
    }

    /** Notes a use; true when it is far enough from the last one noted to be written. */
    public boolean touch(Instant now, String ip) {
        if (lastUsedAt != null && now.isBefore(lastUsedAt.plus(TOUCH_INTERVAL)) && Objects.equals(ip, lastUsedIp))
            return false;
        this.lastUsedAt = now;
        this.lastUsedIp = ip;
        return true;
    }

    /** Stops the token from working; revoking it again changes nothing. */
    public void revoke(Instant now) {
        if (revokedAt == null) this.revokedAt = now;
    }

    private static String text(String value, int max, String label) {
        String stripped = value == null ? "" : value.strip();
        if (stripped.isEmpty()) throw new DomainRuleViolation(label + "을 입력해 주세요");
        if (stripped.length() > max) throw new DomainRuleViolation(label + "은 " + max + "자 이하로 입력해 주세요");
        return stripped;
    }
}

package xyz.goraebap.cowork.module.user.application.agenttoken;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;
import xyz.goraebap.cowork.shared.web.CurrentUser;
import xyz.goraebap.cowork.shared.web.Role;

public final class AgentTokenViews {
    private AgentTokenViews() {}

    /**
     * One of the member's tokens as 에이전트 토큰 lists it: what it is for, its agent, its first characters, when it was
     * made and stops working (none when it lasts until revoked), when and from where it was last used, and whether it
     * has expired.
     */
    @Schema(name = "AgentTokenView")
    public record TokenView(
            UUID id,
            String name,
            String agentName,
            String prefix,
            Instant createdAt,
            @Schema(nullable = true) Instant expiresAt,
            @Schema(nullable = true) Instant lastUsedAt,
            @Schema(nullable = true) String lastUsedIp,
            boolean expired,
            UUID profileId) {}

    @Schema(name = "AgentProfileView")
    public record ProfileView(UUID id, String name, String icon, String color, long version) {}

    /** A token just made, with the token itself: the only time it is shown. */
    @Schema(name = "AgentTokenCreated")
    public record Created(TokenView token, String secret) {}

    /**
     * The member an agent acts for with one of their tokens: who they are, the roles they hold now, the token and the
     * agent it names. It acts with the member's own permissions.
     */
    public record Agent(
            UUID id,
            String email,
            String name,
            Set<Role> roles,
            UUID tokenId,
            String agentName,
            xyz.goraebap.cowork.shared.web.AgentActor agentProfile)
            implements CurrentUser {
        public Agent(UUID id, String email, String name, Set<Role> roles, UUID tokenId, String agentName) {
            this(id, email, name, roles, tokenId, agentName, null);
        }

        public Agent {
            var sorted = EnumSet.noneOf(Role.class);
            sorted.addAll(roles);
            roles = Collections.unmodifiableSet(sorted);
        }
    }
}

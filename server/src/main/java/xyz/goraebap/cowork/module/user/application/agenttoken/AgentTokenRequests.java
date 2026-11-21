package xyz.goraebap.cowork.module.user.application.agenttoken;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.time.LocalDate;
import xyz.goraebap.cowork.module.user.domain.agenttoken.AgentToken;

public final class AgentTokenRequests {
    private AgentTokenRequests() {}

    /** How long a new token works: 30, 90 or 365 days, or until it is revoked. */
    @Schema(name = "AgentTokenLifetime")
    public enum Lifetime {
        DAYS_30(Duration.ofDays(30)),
        DAYS_90(Duration.ofDays(90)),
        DAYS_365(Duration.ofDays(365)),
        NONE(null);

        private final Duration length;

        Lifetime(Duration length) {
            this.length = length;
        }

        /** How long it lasts; null when it lasts until revoked. */
        Duration length() {
            return length;
        }
    }

    /** A new token: what it is for (as the list shows it), the agent that uses it, and how long it works. */
    @Schema(name = "AgentTokenCreate")
    public record Create(
            @NotBlank @Size(max = AgentToken.NAME_MAX) String name,
            @Size(max = AgentToken.AGENT_NAME_MAX) String agentName,
            Lifetime lifetime,
            LocalDate expiresOn,
            java.util.UUID profileId,
            String icon,
            String color) {
        public Create(String name, String agentName, Lifetime lifetime) {
            this(name, agentName, lifetime, null, null, null, null);
        }
    }

    public record EditProfile(
            @jakarta.validation.constraints.PositiveOrZero long expectedVersion,
            @NotBlank @Size(max = 64) String name,
            @NotBlank @Size(max = 100) String icon,
            @NotBlank @Size(max = 7) String color) {}
}

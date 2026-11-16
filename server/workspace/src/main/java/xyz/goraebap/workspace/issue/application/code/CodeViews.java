package xyz.goraebap.workspace.issue.application.code;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class CodeViews {
    private CodeViews() {}

    /**
     * A project's repository on a host: where, whose token (none: connected by hand), the address deliveries come to and
     * the secret they are signed with (only for Workspace administrators, else empty), whether the server registered the
     * webhook itself, and when one last came and what went wrong.
     */
    @Schema(name = "CodeIntegration")
    public record Integration(
            UUID id,
            String provider,
            String baseUrl,
            String repository,
            String webUrl,
            boolean hasToken,
            String accountLogin,
            String webhookUrl,
            String webhookSecret,
            boolean webhookRegistered,
            Instant lastEventAt,
            String lastError,
            long version) {}

    /** One event's rule: whether the project set it, the column it moves to (none: stays), and the board's default. */
    @Schema(name = "CodeRule")
    public record Rule(String event, boolean set, UUID columnId, UUID defaultColumnId) {}

    @Schema(name = "CodeRules")
    public record Rules(List<Rule> items) {
        public Rules {
            items = List.copyOf(items);
        }
    }

    /**
     * A work item's link into a repository: what it is (branch, pull_request, commit), its name or number or sha, where
     * it opens, its title, its state, who moved it last and its detail (a request's branch, a commit's branch).
     */
    @Schema(name = "CodeLink")
    public record Link(
            UUID id,
            UUID integrationId,
            String provider,
            String baseUrl,
            String repository,
            String kind,
            String externalId,
            String url,
            String title,
            String state,
            String author,
            String detail,
            Instant updatedAt) {}
}

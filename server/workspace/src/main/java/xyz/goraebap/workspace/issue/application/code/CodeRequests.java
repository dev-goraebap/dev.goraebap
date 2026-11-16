package xyz.goraebap.workspace.issue.application.code;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public final class CodeRequests {
    private CodeRequests() {}

    /**
     * A repository to connect: its host (github, gitlab, gitea), the host's address (for GitLab and Gitea at their own;
     * none: the host's own), the repository (group/project or owner/repository, or its address pasted), and a token to
     * check it and register the webhook (none: the webhook is registered by hand).
     */
    @Schema(name = "CodeConnect")
    public record Connect(
            @NotNull @Pattern(regexp = "github|gitlab|gitea") String provider,

            @Size(max = 255) String baseUrl,
            @NotBlank @Size(max = 255) String repository,
            @Size(max = 500) String token) {}

    /** A new token for a connection, over the version read. */
    @Schema(name = "CodeRevise")
    public record Revise(
            @NotNull @Min(0) Long expectedVersion,
            @NotBlank @Size(max = 500) String token) {}

    /** One event's rule: set or not (back to the board's default), and the column it moves to (none: it stays). */
    @Schema(name = "CodeRuleInput")
    public record Rule(
            @NotNull @Pattern(regexp = "branch_push|pr_opened|pr_merged") String event,

            boolean set,
            UUID columnId) {}

    @Schema(name = "CodeRulesInput")
    public record Rules(@NotNull @Size(max = 3) List<@Valid @NotNull Rule> items) {
        public Rules {
            items = items == null ? List.of() : List.copyOf(items);
        }
    }
}

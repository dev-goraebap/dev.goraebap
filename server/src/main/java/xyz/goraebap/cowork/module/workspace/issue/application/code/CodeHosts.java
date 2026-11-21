package xyz.goraebap.cowork.module.workspace.issue.application.code;

import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import xyz.goraebap.cowork.module.workspace.issue.domain.board.ColumnCategory;
import xyz.goraebap.cowork.module.workspace.issue.domain.board.IssueColumn;
import xyz.goraebap.cowork.module.workspace.issue.domain.code.GitHost;
import xyz.goraebap.cowork.module.workspace.issue.domain.code.Integration;
import xyz.goraebap.cowork.module.workspace.issue.domain.code.Provider;
import xyz.goraebap.cowork.module.workspace.issue.domain.code.Remote;
import xyz.goraebap.cowork.module.workspace.issue.domain.code.RuleEvent;

/**
 * The hosts and what a connection needs of them (BIT's Hosts): each host's adapter, the sealed token and secret opened,
 * the address deliveries come to (the app's own origin, app.auth.allowed-origins' first), and the column an event moves
 * a work item to by the project's rules or the board's categories.
 */
@Component
class CodeHosts {
    private final Map<Provider, GitHost> hosts;
    private final TokenCipher tokenCipher;
    private final String publicUrl;

    CodeHosts(List<GitHost> adapters, TokenCipher tokenCipher, @Value("${app.auth.allowed-origins}") String origins) {
        this.hosts = new EnumMap<>(adapters.stream().collect(Collectors.toMap(GitHost::provider, Function.identity())));
        this.tokenCipher = tokenCipher;
        this.publicUrl = Arrays.stream(origins.split(","))
                .map(String::strip)
                .filter(origin -> !origin.isEmpty())
                .findFirst()
                .orElse("")
                .replaceAll("/+$", "");
    }

    GitHost of(Provider provider) {
        return hosts.get(provider);
    }

    TokenCipher cipher() {
        return tokenCipher;
    }

    /** How to call the host for a connection; only one with a token can be called. */
    Remote.Connection connection(Integration integration) {
        return new Remote.Connection(
                integration.baseUrl(),
                integration.repository(),
                integration.externalRepositoryId(),
                integration.hasToken() ? tokenCipher.open(integration.tokenCipher()) : null);
    }

    String secret(Integration integration) {
        return tokenCipher.open(integration.webhookSecretCipher());
    }

    String hookUrl(UUID integrationId) {
        return publicUrl + "/api/v1/hooks/" + integrationId;
    }

    /** The column an event moves to: the project's rule, else the board's default for it. Empty: it stays. */
    static Optional<UUID> column(RuleEvent event, Map<RuleEvent, Optional<UUID>> rules, List<IssueColumn> columns) {
        if (rules.containsKey(event))
            return rules.get(event).filter(id -> columns.stream()
                    .anyMatch(column -> column.id().equals(id)));
        return Optional.ofNullable(defaultColumn(event, columns));
    }

    /**
     * The board's own choice (BIT's): a pushed branch starts the work (the first column under way), an opened request
     * puts it under review (the last one under way), a merged one finishes it (the first done one, never a canceled one).
     */
    static UUID defaultColumn(RuleEvent event, List<IssueColumn> columns) {
        var started = columns.stream()
                .filter(column -> column.category() == ColumnCategory.STARTED)
                .toList();
        return switch (event) {
            case branch_push -> started.isEmpty() ? null : started.getFirst().id();
            case pr_opened -> started.isEmpty() ? null : started.getLast().id();
            case pr_merged ->
                columns.stream()
                        .filter(column -> column.category() == ColumnCategory.COMPLETED)
                        .findFirst()
                        .map(IssueColumn::id)
                        .orElse(null);
        };
    }
}

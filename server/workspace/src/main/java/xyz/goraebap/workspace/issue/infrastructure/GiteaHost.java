package xyz.goraebap.workspace.issue.infrastructure;

import static xyz.goraebap.workspace.issue.infrastructure.HostHttp.at;
import static xyz.goraebap.workspace.issue.infrastructure.HostHttp.bool;
import static xyz.goraebap.workspace.issue.infrastructure.HostHttp.s;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;
import xyz.goraebap.workspace.issue.domain.code.GitHost;
import xyz.goraebap.workspace.issue.domain.code.GitHostException;
import xyz.goraebap.workspace.issue.domain.code.Provider;
import xyz.goraebap.workspace.issue.domain.code.Remote;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Gitea's REST API v1 at its own address with an access token (BIT's GiteaHost). Deliveries are signed with
 * HMAC-SHA256 over the body.
 */
@Component
class GiteaHost implements GitHost {
    private final HostHttp http;

    GiteaHost(JsonMapper jsonMapper) {
        this.http = new HostHttp(jsonMapper);
    }

    @Override
    public Provider provider() {
        return Provider.gitea;
    }

    @Override
    public Remote.Repository verify(Remote.Connection c) {
        var repo = http.get(repo(c), headers(c));
        String login;
        try {
            login = s(http.get(api(c) + "/user", headers(c)), "login");
        } catch (GitHostException scoped) {
            login = null;
        }
        return new Remote.Repository(s(repo, "full_name"), s(repo, "id"), s(repo, "html_url"), login);
    }

    @Override
    public Optional<String> createWebhook(Remote.Connection c, String url, String secret) {
        var payload = Map.of(
                "type",
                "gitea",
                "active",
                true,
                "events",
                List.of("push", "pull_request"),
                "config",
                Map.of("url", url, "content_type", "json", "secret", secret));
        try {
            return Optional.ofNullable(s(http.send("POST", repo(c) + "/hooks", headers(c), payload), "id"));
        } catch (GitHostException refused) {
            if (refused.status() == 403 || refused.status() == 404 || refused.status() == 422) return Optional.empty();
            throw refused;
        }
    }

    @Override
    public void deleteWebhook(Remote.Connection c, String webhookId) {
        try {
            http.send("DELETE", repo(c) + "/hooks/" + webhookId, headers(c), null);
        } catch (GitHostException gone) {
            if (gone.status() != 404) throw gone;
        }
    }

    @Override
    public boolean signed(Map<String, String> headers, byte[] body, String secret) {
        return HostHttp.hmac(body, secret, headers.get("x-gitea-signature"));
    }

    @Override
    public List<Remote.Event> read(Map<String, String> headers, byte[] body) {
        String event = headers.getOrDefault("x-gitea-event", "");
        var p = http.json().readTree(body);
        String sender = at(p, "/sender/login");
        return switch (event) {
            case "push" -> push(p, sender);
            case "pull_request" -> pull(p, sender);
            default -> List.of();
        };
    }

    private List<Remote.Event> push(JsonNode p, String sender) {
        String ref = s(p, "ref");
        if (ref == null
                || !ref.startsWith("refs/heads/")
                || bool(p, "/deleted")
                || "0000000000000000000000000000000000000000".equals(s(p, "after"))) return List.of();
        String branch = ref.substring("refs/heads/".length());
        var commits = new ArrayList<Remote.Commit>();
        for (JsonNode each : p.path("commits"))
            commits.add(new Remote.Commit(s(each, "id"), s(each, "message"), s(each, "url"), at(each, "/author/name")));
        String base = at(p, "/repository/html_url");
        return List.of(new Remote.Push(branch, base == null ? null : base + "/src/branch/" + branch, commits, sender));
    }

    private List<Remote.Event> pull(JsonNode p, String sender) {
        String action = s(p, "action");
        if (action == null) return List.of();
        action = switch (action) {
            case "closed" -> bool(p, "/pull_request/merged") ? "merged" : "closed";
            case "ready_for_review" -> "ready";
            case "opened", "reopened", "edited" -> action;
            default -> null;
        };
        if (action == null) return List.of();
        var pr = p.path("pull_request");
        return List.of(new Remote.PullEvent(
                action,
                s(pr, "number"),
                s(pr, "title"),
                s(pr, "body"),
                s(pr, "html_url"),
                at(pr, "/head/ref"),
                bool(pr, "/draft"),
                sender));
    }

    private static String api(Remote.Connection c) {
        return c.baseUrl().replaceAll("/+$", "") + "/api/v1";
    }

    private static String repo(Remote.Connection c) {
        return api(c) + "/repos/" + c.repository();
    }

    private static Map<String, String> headers(Remote.Connection c) {
        return Map.of("Authorization", "token " + c.token());
    }
}

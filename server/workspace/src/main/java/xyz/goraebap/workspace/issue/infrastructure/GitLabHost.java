package xyz.goraebap.workspace.issue.infrastructure;

import static xyz.goraebap.workspace.issue.infrastructure.HostHttp.at;
import static xyz.goraebap.workspace.issue.infrastructure.HostHttp.bool;
import static xyz.goraebap.workspace.issue.infrastructure.HostHttp.s;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
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
 * GitLab's REST API v4 (gitlab.com or self-managed at its own address) with a personal,
 * project or group token (BIT's GitLabHost). Merge requests are its pull requests.
 */
@Component
class GitLabHost implements GitHost {
    private final HostHttp http;

    GitLabHost(JsonMapper jsonMapper) {
        this.http = new HostHttp(jsonMapper);
    }

    @Override
    public Provider provider() {
        return Provider.gitlab;
    }

    @Override
    public Remote.Repository verify(Remote.Connection c) {
        var project =
                http.get(api(c) + "/projects/" + URLEncoder.encode(c.repository(), StandardCharsets.UTF_8), headers(c));
        String login;
        try {
            login = s(http.get(api(c) + "/user", headers(c)), "username");
        } catch (GitHostException projectToken) {
            login = null;
        }
        return new Remote.Repository(s(project, "path_with_namespace"), s(project, "id"), s(project, "web_url"), login);
    }

    @Override
    public Optional<String> createWebhook(Remote.Connection c, String url, String secret) {
        var payload = new LinkedHashMap<String, Object>();
        payload.put("url", url);
        payload.put("token", secret);
        payload.put("push_events", true);
        payload.put("merge_requests_events", true);
        payload.put("enable_ssl_verification", url.startsWith("https://"));
        try {
            return Optional.ofNullable(s(http.send("POST", project(c) + "/hooks", headers(c), payload), "id"));
        } catch (GitHostException refused) {
            if (refused.status() == 403 || refused.status() == 404 || refused.status() == 422) return Optional.empty();
            throw refused;
        }
    }

    @Override
    public void deleteWebhook(Remote.Connection c, String webhookId) {
        try {
            http.send("DELETE", project(c) + "/hooks/" + webhookId, headers(c), null);
        } catch (GitHostException gone) {
            if (gone.status() != 404) throw gone;
        }
    }

    @Override
    public boolean signed(Map<String, String> headers, byte[] body, String secret) {
        return HostHttp.same(headers.get("x-gitlab-token"), secret);
    }

    @Override
    public List<Remote.Event> read(Map<String, String> headers, byte[] body) {
        String event = headers.getOrDefault("x-gitlab-event", "");
        var p = http.json().readTree(body);
        String sender = at(p, "/user/username");
        if (sender == null) sender = s(p, "user_username");
        return switch (event) {
            case "Push Hook" -> push(p, sender);
            case "Merge Request Hook" -> mergeRequest(p, sender);
            default -> List.of();
        };
    }

    private List<Remote.Event> push(JsonNode p, String sender) {
        String ref = s(p, "ref");
        if (ref == null
                || !ref.startsWith("refs/heads/")
                || "0000000000000000000000000000000000000000".equals(s(p, "after"))) return List.of();
        String branch = ref.substring("refs/heads/".length());
        var commits = new ArrayList<Remote.Commit>();
        for (JsonNode each : p.path("commits"))
            commits.add(new Remote.Commit(s(each, "id"), s(each, "message"), s(each, "url"), at(each, "/author/name")));
        String base = at(p, "/project/web_url");
        return List.of(new Remote.Push(branch, base == null ? null : base + "/-/tree/" + branch, commits, sender));
    }

    private List<Remote.Event> mergeRequest(JsonNode p, String sender) {
        var mr = p.path("object_attributes");
        String action = s(mr, "action");
        if (action == null) return List.of();
        boolean draft = bool(mr, "/draft") || bool(mr, "/work_in_progress");
        action = switch (action) {
            case "open" -> "opened";
            case "reopen" -> "reopened";
            case "close" -> "closed";
            case "merge" -> "merged";
            // Leaving draft shows as an update whose changes turn draft off.
            case "update" -> p.at("/changes/draft/current").isBoolean() && !draft ? "ready" : "edited";
            default -> null;
        };
        if (action == null) return List.of();
        return List.of(new Remote.PullEvent(
                action,
                s(mr, "iid"),
                s(mr, "title"),
                s(mr, "description"),
                s(mr, "url"),
                s(mr, "source_branch"),
                draft,
                sender));
    }

    private static String api(Remote.Connection c) {
        return c.baseUrl().replaceAll("/+$", "") + "/api/v4";
    }

    /** The project by the id read when it was connected, or by its path before that. */
    private static String project(Remote.Connection c) {
        String id = c.externalRepositoryId() != null
                ? c.externalRepositoryId()
                : URLEncoder.encode(c.repository(), StandardCharsets.UTF_8);
        return api(c) + "/projects/" + id;
    }

    private static Map<String, String> headers(Remote.Connection c) {
        return Map.of("PRIVATE-TOKEN", c.token());
    }
}

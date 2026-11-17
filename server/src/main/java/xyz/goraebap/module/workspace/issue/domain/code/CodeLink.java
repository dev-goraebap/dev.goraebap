package xyz.goraebap.module.workspace.issue.domain.code;

import java.time.Instant;
import java.util.UUID;

/**
 * A work item tied to what lives in a repository (BIT D-087): a branch named after it, a pull or merge request naming
 * it (and its state), or a commit naming it. externalId is the branch's name, the request's number or the commit's sha;
 * detail the request's branch, the commit's branch, or a branch's last commit.
 */
public record CodeLink(
        UUID id,
        UUID integrationId,
        UUID issueId,
        Kind kind,
        String externalId,
        String url,
        String title,
        State state,
        String author,
        String detail,
        Instant createdAt,
        Instant updatedAt) {
    public static final int TITLE_MAX = 500;

    public enum Kind {
        branch,
        pull_request,
        commit
    }

    public enum State {
        open,
        draft,
        merged,
        closed
    }

    public CodeLink {
        title = clip(title == null || title.isBlank() ? externalId : title, TITLE_MAX);
        author = clip(author, 128);
        detail = clip(detail, 500);
        url = clip(url, 1000);
        externalId = clip(externalId, 255);
    }

    public static CodeLink of(
            UUID integrationId,
            UUID issueId,
            Kind kind,
            String externalId,
            String url,
            String title,
            State state,
            String author,
            String detail,
            Instant now) {
        return new CodeLink(
                UUID.randomUUID(),
                integrationId,
                issueId,
                kind,
                externalId,
                url,
                title,
                state,
                author,
                detail,
                now,
                now);
    }

    /** The same link seen again: what it is now called, its state, who moved it and when. */
    public CodeLink seen(String title, State state, String author, String detail, Instant now) {
        return new CodeLink(
                id,
                integrationId,
                issueId,
                kind,
                externalId,
                url,
                title,
                state,
                author == null ? this.author : author,
                detail == null ? this.detail : detail,
                createdAt,
                now);
    }

    private static String clip(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }
}

package xyz.goraebap.cowork.module.workspace.issue.domain.code;

import java.util.List;

/** What the hosts' APIs and webhooks carry, in common terms (BIT D-087). Text fields are as the host sent them. */
public final class Remote {
    private Remote() {}

    /** Where to call and with what: the host's address, the repository, its id on the host and the token in clear. */
    public record Connection(String baseUrl, String repository, String externalRepositoryId, String token) {
        @Override
        public String toString() {
            return "Connection[" + baseUrl + ", " + repository + "]";
        }
    }

    /** The repository as the host names it, its id (GitLab's number), its web address and whose the token is. */
    public record Repository(String fullName, String externalId, String webUrl, String accountLogin) {}

    public sealed interface Event permits Push, PullEvent {}

    /** Commits pushed to a branch; a deleted branch is not one. */
    public record Push(String branch, String branchUrl, List<Commit> commits, String sender) implements Event {
        public Push {
            commits = List.copyOf(commits);
        }
    }

    public record Commit(String sha, String message, String url, String author) {}

    /** action: opened, reopened, closed, merged, ready (out of draft) or edited. */
    public record PullEvent(
            String action,
            String number,
            String title,
            String body,
            String url,
            String branch,
            boolean draft,
            String sender)
            implements Event {}
}

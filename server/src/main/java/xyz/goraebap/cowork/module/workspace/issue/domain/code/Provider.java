package xyz.goraebap.cowork.module.workspace.issue.domain.code;

/**
 * The hosts a project connects a repository on (BIT D-087); GitLab and Gitea may be self-hosted at their own address
 */
public enum Provider {
    github("GitHub", "https://github.com"),
    gitlab("GitLab", "https://gitlab.com"),
    gitea("Gitea", null);

    private final String label;
    private final String defaultUrl;

    Provider(String label, String defaultUrl) {
        this.label = label;
        this.defaultUrl = defaultUrl;
    }

    /** The host's name as people write it. */
    public String label() {
        return label;
    }

    /** The host's web address when none is given; Gitea has none and always needs one. */
    public String defaultUrl() {
        return defaultUrl;
    }
}

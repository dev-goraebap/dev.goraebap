package xyz.goraebap.workspace.issue.domain.code;

/** What happens in a repository that can move a work item to another status (BIT D-087, Kaneo's workflow rules). */
public enum RuleEvent {
    /** A branch named after the work item was pushed: work started. */
    branch_push,
    /** A pull or merge request for it was opened: under review. */
    pr_opened,
    /** It was merged: done. */
    pr_merged
}

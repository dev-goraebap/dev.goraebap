package xyz.goraebap.productivity.issue.domain.issue;

import java.time.Instant;
import java.util.UUID;

/**
 * One thing that happened to an issue, for its timeline: made, or a property changed from before to after, each as the
 * timeline shows it (a column's or label's name then, a person's id, a date, a type or priority code, a parent's ref).
 */
public record IssueActivity(UUID id, UUID issueId, Field field, String before, String after, Instant at, UUID actorId) {
    public static final int VALUE_MAX = 400;

    public enum Field {
        COMMENT_EDITED,
        COMMENT_RESOLVED,
        COMMENT_REOPENED,
        COMMENT_DELETED,
        CREATED,
        TITLE,
        TYPE,
        STATUS,
        PRIORITY,
        ASSIGNEE,
        START_DATE,
        DUE_DATE,
        PARENT,
        LABELS,
        ESTIMATE,
        STORY_POINTS,
        TIME_SPENT,
        CYCLE,
        BODY,
        DELETED
    }

    public IssueActivity {
        before = clip(before);
        after = clip(after);
    }

    private static String clip(String value) {
        return value == null || value.length() <= VALUE_MAX ? value : value.substring(0, VALUE_MAX);
    }
}

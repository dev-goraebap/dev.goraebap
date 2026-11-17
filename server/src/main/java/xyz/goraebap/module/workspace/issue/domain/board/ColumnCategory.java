package xyz.goraebap.module.workspace.issue.domain.board;

/**
 * What a board column means whatever it is called (BIT's five status categories): not planned, not started, under way,
 * done and dropped. The last two close an issue.
 */
public enum ColumnCategory {
    BACKLOG,
    UNSTARTED,
    STARTED,
    COMPLETED,
    CANCELED;

    public boolean closes() {
        return this == COMPLETED || this == CANCELED;
    }
}

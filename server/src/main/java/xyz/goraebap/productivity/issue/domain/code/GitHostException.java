package xyz.goraebap.productivity.issue.domain.code;

/** A host refused a call (its HTTP status) or could not be reached (0); the message is safe to show a manager. */
public final class GitHostException extends RuntimeException {
    private final int status;

    public GitHostException(int status, String message) {
        super(message);
        this.status = status;
    }

    public int status() {
        return status;
    }
}

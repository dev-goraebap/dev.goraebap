package xyz.goraebap.foundation.outbox;

/**
 * Does what the lines of one topic ask, implemented by the module that owns the change. The same line may arrive more
 * than once (a crash between doing it and marking it done), so handling it again must change nothing. A business
 * refusal (BusinessException, DomainRuleViolation) ends the line as failed at once; any other exception is tried again
 * later.
 */
public interface OutboxHandlerSpi {
    String topic();

    void handle(OutboxMessage message);
}

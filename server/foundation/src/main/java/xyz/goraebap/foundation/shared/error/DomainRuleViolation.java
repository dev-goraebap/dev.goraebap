package xyz.goraebap.foundation.shared.error;

public class DomainRuleViolation extends RuntimeException {

    public DomainRuleViolation(String message) {
        super(message);
    }
}

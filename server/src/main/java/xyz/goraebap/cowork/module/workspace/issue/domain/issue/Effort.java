package xyz.goraebap.cowork.module.workspace.issue.domain.issue;

import java.math.BigDecimal;
import java.math.RoundingMode;
import xyz.goraebap.cowork.shared.error.DomainRuleViolation;

/** Effort as people say it (hours, 1.5) and as it is kept (whole minutes). */
public final class Effort {
    private Effort() {}

    /** Hours as whole minutes; none stays none. */
    public static Integer minutes(Double hours) {
        if (hours == null) return null;
        if (hours.isNaN() || hours.isInfinite() || hours <= 0) throw new DomainRuleViolation("시간은 0보다 커야 합니다");
        return (int) Math.round(hours * 60);
    }

    /** Minutes as hours for the timeline, without a trailing .0 (1.5, 2). */
    public static String hours(Integer minutes) {
        if (minutes == null) return null;
        return new BigDecimal(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP)
                .stripTrailingZeros()
                .toPlainString();
    }
}

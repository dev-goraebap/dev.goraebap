package xyz.goraebap.module.workspace.issue.domain.cycle;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.UUID;
import xyz.goraebap.shared.error.DomainRuleViolation;

/**
 * How a project runs its cycles (Linear's cycle settings): whether it uses them, how many weeks one runs, the day of the
 * week one starts, how many cycles after the current one are kept ready, and whether a work item that gets under way or
 * done goes into the current cycle by itself.
 */
public record CycleSettings(
        UUID projectId,
        boolean isEnabled,
        int weeks,
        int startDay,
        int upcoming,
        boolean addsStarted,
        boolean addsCompleted) {
    public CycleSettings {
        if (weeks < 1 || weeks > 8) throw new DomainRuleViolation("사이클 기간은 1~8주입니다");
        if (startDay < 1 || startDay > 7) throw new DomainRuleViolation("시작 요일을 고르세요");
        if (upcoming < 0 || upcoming > 6) throw new DomainRuleViolation("미리 만들 사이클은 0~6개입니다");
    }

    /** A project that has said nothing uses no cycles. */
    public static CycleSettings off(UUID projectId) {
        return new CycleSettings(projectId, false, 2, 1, 2, true, true);
    }

    public int days() {
        return weeks * 7;
    }

    /** The cycle start day on or before a day. */
    public LocalDate startOn(LocalDate day) {
        return day.with(TemporalAdjusters.previousOrSame(DayOfWeek.of(startDay)));
    }
}

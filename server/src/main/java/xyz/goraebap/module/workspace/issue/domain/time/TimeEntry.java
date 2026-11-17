package xyz.goraebap.module.workspace.issue.domain.time;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import xyz.goraebap.shared.error.DomainRuleViolation;

/**
 * Time a member spent on a work item on a day (레드마인의 소요시간): whole minutes, a day at most, with a short note. Its
 * sum is the work item's spent effort, set against its estimate.
 */
public record TimeEntry(
        UUID id, UUID issueId, UUID memberId, LocalDate spentOn, int minutes, String note, Instant createdAt) {
    public static final int NOTE_MAX = 200;

    public static TimeEntry create(
            UUID id, UUID issueId, UUID memberId, LocalDate spentOn, int minutes, String note, Instant now) {
        if (minutes < 1 || minutes > 24 * 60) throw new DomainRuleViolation("하루에 기록할 시간은 1분에서 24시간 사이입니다");
        if (spentOn == null) throw new DomainRuleViolation("일한 날을 정해 주세요");
        String trimmed = note == null || note.isBlank() ? null : note.strip();
        if (trimmed != null && trimmed.length() > NOTE_MAX) throw new DomainRuleViolation("메모는 200자까지입니다");
        return new TimeEntry(id, issueId, memberId, spentOn, minutes, trimmed, now);
    }
}

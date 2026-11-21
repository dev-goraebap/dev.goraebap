package xyz.goraebap.cowork.module.workspace.issue.domain.cycle;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.cowork.shared.error.DomainRuleViolation;

/**
 * A project's cycle (스프린트, Linear's cycle, 레드마인의 버전): a name, what it aims at, the days it runs (both included)
 * and when it was finished. Work items belong to one cycle at most; finishing one passes what is left to another.
 */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Cycle {
    public static final int NAME_MAX = 80;
    public static final int GOAL_MAX = 500;

    /** Where a cycle stands on a day: not begun, under way, its days over but not finished, or finished. */
    public enum State {
        UPCOMING,
        CURRENT,
        ENDED,
        COMPLETED
    }

    @EqualsAndHashCode.Include
    private final UUID id;

    private final UUID projectId;
    private String name;
    private String goal;
    private LocalDate startDate;
    private LocalDate endDate;
    private Instant completedAt;
    private final long version;

    public static Cycle create(UUID id, UUID projectId, String name, String goal, LocalDate start, LocalDate end) {
        var cycle = new Cycle(id, projectId, null, null, null, null, null, 0);
        cycle.revise(name, goal, start, end);
        return cycle;
    }

    public static Cycle fromPersistence(
            UUID id,
            UUID projectId,
            String name,
            String goal,
            LocalDate start,
            LocalDate end,
            Instant completedAt,
            long version) {
        return new Cycle(id, projectId, name, goal, start, end, completedAt, version);
    }

    public void revise(String name, String goal, LocalDate start, LocalDate end) {
        String trimmed = name == null ? "" : name.strip();
        if (trimmed.isEmpty() || trimmed.length() > NAME_MAX) throw new DomainRuleViolation("사이클 이름은 1~80자입니다");
        String aim = goal == null || goal.isBlank() ? null : goal.strip();
        if (aim != null && aim.length() > GOAL_MAX) throw new DomainRuleViolation("사이클 목표는 500자까지입니다");
        if (start == null || end == null) throw new DomainRuleViolation("사이클의 시작일과 종료일을 정해 주세요");
        if (start.isAfter(end)) throw new DomainRuleViolation("사이클의 시작일이 종료일보다 늦습니다");
        this.name = trimmed;
        this.goal = aim;
        this.startDate = start;
        this.endDate = end;
    }

    /** Whether its days share any day with another's. */
    public boolean overlaps(Cycle other) {
        return !other.id.equals(id) && !startDate.isAfter(other.endDate) && !other.startDate.isAfter(endDate);
    }

    public void complete(Instant now) {
        if (completedAt != null) throw new DomainRuleViolation("이미 마친 사이클입니다");
        completedAt = now;
    }

    public boolean isCompleted() {
        return completedAt != null;
    }

    public State stateOn(LocalDate today) {
        if (completedAt != null) return State.COMPLETED;
        if (today.isBefore(startDate)) return State.UPCOMING;
        if (today.isAfter(endDate)) return State.ENDED;
        return State.CURRENT;
    }
}

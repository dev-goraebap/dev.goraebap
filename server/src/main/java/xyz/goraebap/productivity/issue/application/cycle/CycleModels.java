package xyz.goraebap.productivity.issue.application.cycle;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import xyz.goraebap.productivity.issue.domain.cycle.Cycle;

public final class CycleModels {
    private CycleModels() {}

    /** A cycle as made or changed: its name, what it aims at and its days (both included). */
    @Schema(name = "CycleInput")
    public record Input(
            @NotBlank @Size(max = Cycle.NAME_MAX) String name,
            @Size(max = Cycle.GOAL_MAX) String goal,
            @NotNull LocalDate startDate,
            @NotNull LocalDate endDate,
            Long expectedVersion) {}

    /** Finishing a cycle: where its unfinished work items go (another cycle of the project, or none). */
    @Schema(name = "CycleCompletion")
    public record Completion(@NotNull Long expectedVersion, UUID moveTo) {}

    /**
     * What a cycle holds: work items in all, done and dropped; story points in all and done; the estimate and the time
     * spent on its work items, in hours.
     */
    @Schema(name = "CycleTotals")
    public record Totals(
            int workItems,
            int completed,
            int canceled,
            double storyPoints,
            double completedStoryPoints,
            double estimateHours,
            double spentHours) {
        public static final Totals NONE = new Totals(0, 0, 0, 0, 0, 0, 0);
    }

    /** A cycle as the project shows it, where it stands today and what it holds. */
    @Schema(name = "CycleView")
    public record View(
            UUID id,
            String name,
            String goal,
            LocalDate startDate,
            LocalDate endDate,
            Cycle.State state,
            Instant completedAt,
            long version,
            Totals totals) {}

    /** How the project runs its cycles (see CycleSettings). */
    @Schema(name = "CycleSettings")
    public record Settings(
            boolean isEnabled,

            @jakarta.validation.constraints.Min(1) @jakarta.validation.constraints.Max(8) int weeks,

            @jakarta.validation.constraints.Min(1) @jakarta.validation.constraints.Max(7) int startDay,

            @jakarta.validation.constraints.Min(0) @jakarta.validation.constraints.Max(6) int upcoming,

            boolean addsStarted,
            boolean addsCompleted) {}

    /** A project's cycles, the earliest first, how it runs them, and whether the reader may change them. */
    @Schema(name = "CycleList")
    public record Cycles(List<View> cycles, Settings settings, boolean canWrite) {
        public Cycles {
            cycles = List.copyOf(cycles);
        }
    }
}

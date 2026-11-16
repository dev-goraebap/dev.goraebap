package xyz.goraebap.workspace.issue.application.time;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import xyz.goraebap.workspace.issue.domain.time.TimeEntry;

public final class TimeEntryModels {
    private TimeEntryModels() {}

    /** Time spent on a work item: hours (0.25 is 15 minutes), the day (today when none) and a short note. */
    @Schema(name = "TimeEntryInput")
    public record Log(
            @NotNull Double hours,
            LocalDate spentOn,
            @Size(max = TimeEntry.NOTE_MAX) String note) {}

    /** One entry as the work item shows it: who, which day, how long and why; whether the reader may delete it. */
    @Schema(name = "TimeEntry")
    public record Entry(
            UUID id,
            UUID memberId,
            String memberName,
            LocalDate spentOn,
            double hours,
            String note,
            Instant createdAt,
            boolean canDelete) {}

    /** A work item's entries, the latest day first, with their sum and the estimate it is set against. */
    @Schema(name = "TimeEntries")
    public record Entries(List<Entry> entries, double spentHours, Double estimateHours) {
        public Entries {
            entries = List.copyOf(entries);
        }
    }
}

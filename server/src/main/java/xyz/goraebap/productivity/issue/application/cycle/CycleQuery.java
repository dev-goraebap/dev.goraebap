package xyz.goraebap.productivity.issue.application.cycle;

import java.util.Map;
import java.util.UUID;

/** What a project's cycles hold, counted from their live work items. */
public interface CycleQuery {
    Map<UUID, CycleModels.Totals> totals(UUID projectId);
}

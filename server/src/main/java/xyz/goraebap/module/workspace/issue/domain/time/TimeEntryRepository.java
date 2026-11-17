package xyz.goraebap.module.workspace.issue.domain.time;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TimeEntryRepository {
    void save(TimeEntry entry, UUID actor);

    /** A work item's entries, the latest day first. */
    List<TimeEntry> findByIssueId(UUID issueId);

    Optional<TimeEntry> findById(UUID id);

    void delete(UUID id);
}

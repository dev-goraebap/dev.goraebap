package xyz.goraebap.module.workspace.issue.domain.view;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Saved views and each scope's order of them. A scope is the area (no project) or one project. */
public interface SavedViewRepository {
    /** The scope's views the user sees, the shared ones and the user's own personal ones, in the order they were made. */
    List<SavedView> findAllVisible(UUID projectId, UUID userId);

    Optional<SavedView> findById(UUID id);

    void save(SavedView view, UUID actor, Instant now);

    void saveAll(List<SavedView> views, UUID actor, Instant now);

    void deleteById(UUID id);

    /** The scope's order of its shared views (view ids and {@link SavedView#ALL}); empty when none was set. */
    List<String> findOrder(UUID projectId);

    void saveOrder(UUID projectId, List<String> keys, UUID actor, Instant now);
}

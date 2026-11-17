package xyz.goraebap.module.workspace.activity.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import xyz.goraebap.module.workspace.activity.ActivityActor;
import xyz.goraebap.module.workspace.activity.ActivityEntry;
import xyz.goraebap.module.workspace.activity.ActivityEvent;
import xyz.goraebap.module.workspace.activity.ActivityOwner;

public interface ActivityRepository {
    /** The owner's events and live comments, oldest first. */
    List<ActivityEntry> findTimeline(ActivityOwner owner);

    void saveEvents(ActivityOwner owner, List<ActivityEvent> events, ActivityActor actor);

    Optional<ActivityComment> findComment(UUID id);

    void saveComment(ActivityComment comment, ActivityActor actor);
}

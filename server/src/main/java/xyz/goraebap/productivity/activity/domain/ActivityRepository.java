package xyz.goraebap.productivity.activity.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import xyz.goraebap.productivity.activity.ActivityActor;
import xyz.goraebap.productivity.activity.ActivityEntry;
import xyz.goraebap.productivity.activity.ActivityEvent;
import xyz.goraebap.productivity.activity.ActivityOwner;

public interface ActivityRepository {
    /** The owner's events and live comments, oldest first. */
    List<ActivityEntry> findTimeline(ActivityOwner owner);

    void saveEvents(ActivityOwner owner, List<ActivityEvent> events, ActivityActor actor);

    Optional<ActivityComment> findComment(UUID id);

    void saveComment(ActivityComment comment, ActivityActor actor);
}

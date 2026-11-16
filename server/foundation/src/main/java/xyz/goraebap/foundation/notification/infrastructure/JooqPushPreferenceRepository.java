package xyz.goraebap.foundation.notification.infrastructure;

import static xyz.goraebap.foundation.jooq.tables.PushPreference.PUSH_PREFERENCE;

import java.util.Collection;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.foundation.notification.domain.push.PushPreferenceRepository;
import xyz.goraebap.foundation.notification.domain.push.PushTopic;

@Repository
@RequiredArgsConstructor
class JooqPushPreferenceRepository implements PushPreferenceRepository {
    private final DSLContext dslContext;

    @Override
    public Map<UUID, Set<PushTopic>> findMutedByUserIdIn(Collection<UUID> userIds) {
        Map<UUID, Set<PushTopic>> muted = new HashMap<>();
        if (userIds.isEmpty()) return muted;
        dslContext
                .selectFrom(PUSH_PREFERENCE)
                .where(PUSH_PREFERENCE.USER_ID.in(userIds))
                .forEach(row -> {
                    // A group this service no longer has is left out rather than failing the read.
                    for (var topic : PushTopic.values())
                        if (topic.name().equals(row.getTopic()))
                            muted.computeIfAbsent(row.getUserId(), id -> EnumSet.noneOf(PushTopic.class))
                                    .add(topic);
                });
        return muted;
    }

    @Override
    public void saveMuted(UUID userId, Set<PushTopic> muted) {
        dslContext
                .deleteFrom(PUSH_PREFERENCE)
                .where(PUSH_PREFERENCE.USER_ID.eq(userId))
                .execute();
        if (muted.isEmpty()) return;
        var insert = dslContext.insertInto(PUSH_PREFERENCE, PUSH_PREFERENCE.USER_ID, PUSH_PREFERENCE.TOPIC);
        for (var topic : muted) insert = insert.values(userId, topic.name());
        insert.execute();
    }
}

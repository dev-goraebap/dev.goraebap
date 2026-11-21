package xyz.goraebap.cowork.module.user.infrastructure;

import static org.jooq.impl.DSL.selectOne;
import static xyz.goraebap.cowork.jooq.tables.AgentProfile.AGENT_PROFILE;
import static xyz.goraebap.cowork.jooq.tables.AgentToken.AGENT_TOKEN;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.cowork.module.user.application.agenttoken.AgentTokenErrorCode;
import xyz.goraebap.cowork.module.user.domain.agenttoken.AgentProfile;
import xyz.goraebap.cowork.module.user.domain.agenttoken.AgentProfileRepository;

@Repository
@RequiredArgsConstructor
class JooqAgentProfileRepository implements AgentProfileRepository {
    private final DSLContext dslContext;

    public List<AgentProfile> findAllByUserId(UUID id) {
        return dslContext
                .selectFrom(AGENT_PROFILE)
                .where(AGENT_PROFILE.USER_ID.eq(id))
                .and(AGENT_PROFILE.LEGACY_SHARED.isFalse())
                .andNotExists(selectOne()
                        .from(AGENT_TOKEN)
                        .where(AGENT_TOKEN.PROFILE_ID.eq(AGENT_PROFILE.PROFILE_ID))
                        .and(AGENT_TOKEN.REVOKED_AT.isNotNull()))
                .orderBy(AGENT_PROFILE.NAME, AGENT_PROFILE.PROFILE_ID)
                .fetch(r -> AgentProfile.fromPersistence(
                        r.getProfileId(), r.getUserId(), r.getName(), r.getIcon(), r.getColor(), r.getVersion()));
    }

    public Optional<AgentProfile> findById(UUID id) {
        return dslContext
                .selectFrom(AGENT_PROFILE)
                .where(AGENT_PROFILE.PROFILE_ID.eq(id).and(AGENT_PROFILE.LEGACY_SHARED.isFalse()))
                .fetchOptional(r -> AgentProfile.fromPersistence(
                        r.getProfileId(), r.getUserId(), r.getName(), r.getIcon(), r.getColor(), r.getVersion()));
    }

    @Override
    public Map<UUID, String> namesOf(Collection<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        return dslContext
                .select(AGENT_PROFILE.PROFILE_ID, AGENT_PROFILE.NAME)
                .from(AGENT_PROFILE)
                .where(AGENT_PROFILE.PROFILE_ID.in(ids))
                .fetchMap(AGENT_PROFILE.PROFILE_ID, AGENT_PROFILE.NAME);
    }

    public void save(AgentProfile p) {
        if (p.version() == 0) {
            dslContext
                    .insertInto(AGENT_PROFILE)
                    .set(AGENT_PROFILE.PROFILE_ID, p.id())
                    .set(AGENT_PROFILE.USER_ID, p.userId())
                    .set(AGENT_PROFILE.NAME, p.name())
                    .set(AGENT_PROFILE.ICON, p.icon())
                    .set(AGENT_PROFILE.COLOR, p.color())
                    .set(AGENT_PROFILE.VERSION, 0L)
                    .execute();
            return;
        }
        int changed = dslContext
                .update(AGENT_PROFILE)
                .set(AGENT_PROFILE.NAME, p.name())
                .set(AGENT_PROFILE.ICON, p.icon())
                .set(AGENT_PROFILE.COLOR, p.color())
                .set(AGENT_PROFILE.VERSION, p.version())
                .where(AGENT_PROFILE
                        .PROFILE_ID
                        .eq(p.id())
                        .and(AGENT_PROFILE.USER_ID.eq(p.userId()))
                        .and(AGENT_PROFILE.VERSION.eq(p.version() - 1)))
                .execute();
        if (changed != 1) throw AgentTokenErrorCode.AGENT_PROFILE_VERSION_CONFLICT.raise();
    }
}

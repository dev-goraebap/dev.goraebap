package xyz.goraebap.cowork.module.workspace.richbody.infrastructure;

import static xyz.goraebap.cowork.jooq.tables.DocumentEditing.DOCUMENT_EDITING;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.cowork.module.workspace.richbody.domain.EditingRepository;

@Repository
@RequiredArgsConstructor
class JooqEditingRepository implements EditingRepository {
    private final DSLContext dsl;

    @Override
    public List<Lease> active(String type, UUID id, Instant after) {
        var started = DSL.min(DOCUMENT_EDITING.STARTED_AT);
        return dsl.select(DOCUMENT_EDITING.USER_ID, started)
                .from(DOCUMENT_EDITING)
                .where(DOCUMENT_EDITING
                        .OWNER_TYPE
                        .eq(type)
                        .and(DOCUMENT_EDITING.OWNER_ID.eq(id))
                        .and(DOCUMENT_EDITING.LAST_SEEN_AT.gt(after)))
                .groupBy(DOCUMENT_EDITING.USER_ID)
                .orderBy(started.asc(), DOCUMENT_EDITING.USER_ID.asc())
                .fetch(row -> new Lease(row.value1(), row.value2()));
    }

    @Override
    public boolean keep(String type, UUID id, UUID user, UUID lease, Instant now, Instant after) {
        var key = DOCUMENT_EDITING
                .OWNER_TYPE
                .eq(type)
                .and(DOCUMENT_EDITING.OWNER_ID.eq(id))
                .and(DOCUMENT_EDITING.USER_ID.eq(user))
                .and(DOCUMENT_EDITING.LEASE_ID.eq(lease));
        boolean joined = !dsl.fetchExists(DOCUMENT_EDITING, key.and(DOCUMENT_EDITING.LAST_SEEN_AT.gt(after)));
        dsl.insertInto(DOCUMENT_EDITING)
                .set(DOCUMENT_EDITING.OWNER_TYPE, type)
                .set(DOCUMENT_EDITING.OWNER_ID, id)
                .set(DOCUMENT_EDITING.USER_ID, user)
                .set(DOCUMENT_EDITING.LEASE_ID, lease)
                .set(DOCUMENT_EDITING.STARTED_AT, now)
                .set(DOCUMENT_EDITING.LAST_SEEN_AT, now)
                .onConflict(
                        DOCUMENT_EDITING.OWNER_TYPE,
                        DOCUMENT_EDITING.OWNER_ID,
                        DOCUMENT_EDITING.USER_ID,
                        DOCUMENT_EDITING.LEASE_ID)
                .doUpdate()
                .set(
                        DOCUMENT_EDITING.STARTED_AT,
                        DSL.when(DOCUMENT_EDITING.LAST_SEEN_AT.le(after), now).otherwise(DOCUMENT_EDITING.STARTED_AT))
                .set(DOCUMENT_EDITING.LAST_SEEN_AT, now)
                .execute();
        return joined;
    }

    @Override
    public boolean remove(String type, UUID id, UUID user, UUID lease) {
        return dsl.deleteFrom(DOCUMENT_EDITING)
                        .where(DOCUMENT_EDITING
                                .OWNER_TYPE
                                .eq(type)
                                .and(DOCUMENT_EDITING.OWNER_ID.eq(id))
                                .and(DOCUMENT_EDITING.USER_ID.eq(user))
                                .and(DOCUMENT_EDITING.LEASE_ID.eq(lease)))
                        .execute()
                > 0;
    }

    @Override
    public List<Owner> expire(Instant before) {
        var owners = dsl.selectDistinct(DOCUMENT_EDITING.OWNER_TYPE, DOCUMENT_EDITING.OWNER_ID)
                .from(DOCUMENT_EDITING)
                .where(DOCUMENT_EDITING.LAST_SEEN_AT.le(before))
                .fetch(row -> new Owner(row.value1(), row.value2()));
        dsl.deleteFrom(DOCUMENT_EDITING)
                .where(DOCUMENT_EDITING.LAST_SEEN_AT.le(before))
                .execute();
        return owners;
    }
}

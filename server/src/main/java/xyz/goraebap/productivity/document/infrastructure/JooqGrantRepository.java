package xyz.goraebap.productivity.document.infrastructure;

import static xyz.goraebap.jooq.tables.DocumentGrant.DOCUMENT_GRANT;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;
import xyz.goraebap.productivity.document.domain.access.Grant;
import xyz.goraebap.productivity.document.domain.access.GrantRepository;

@Repository
@RequiredArgsConstructor
class JooqGrantRepository implements GrantRepository {
    private final DSLContext dslContext;

    @Override
    public Map<UUID, List<Grant>> findAllByTarget(Target target) {
        return dslContext
                .selectFrom(DOCUMENT_GRANT)
                .where(DOCUMENT_GRANT.TARGET_TYPE.eq(target.name()))
                .fetch()
                .stream()
                .collect(Collectors.groupingBy(
                        row -> row.getTargetId(), Collectors.mapping(JooqGrantRepository::grant, Collectors.toList())));
    }

    @Override
    public List<Grant> findByTarget(Target target, UUID id) {
        return dslContext
                .selectFrom(DOCUMENT_GRANT)
                .where(DOCUMENT_GRANT.TARGET_TYPE.eq(target.name()).and(DOCUMENT_GRANT.TARGET_ID.eq(id)))
                .fetch(JooqGrantRepository::grant);
    }

    @Override
    public void replace(Target target, UUID id, List<Grant> grants, UUID actor, Instant now) {
        dslContext
                .deleteFrom(DOCUMENT_GRANT)
                .where(DOCUMENT_GRANT.TARGET_TYPE.eq(target.name()).and(DOCUMENT_GRANT.TARGET_ID.eq(id)))
                .execute();
        if (grants.isEmpty()) return;
        var insert = dslContext.insertInto(
                DOCUMENT_GRANT,
                DOCUMENT_GRANT.GRANT_ID,
                DOCUMENT_GRANT.TARGET_TYPE,
                DOCUMENT_GRANT.TARGET_ID,
                DOCUMENT_GRANT.SUBJECT_TYPE,
                DOCUMENT_GRANT.SUBJECT_ID,
                DOCUMENT_GRANT.LEVEL,
                DOCUMENT_GRANT.CREATED_AT,
                DOCUMENT_GRANT.CREATED_BY);
        for (Grant grant : grants)
            insert = insert.values(
                    UUID.randomUUID(),
                    target.name(),
                    id,
                    grant.subject().name(),
                    grant.subjectId(),
                    grant.level().name(),
                    now,
                    actor);
        insert.execute();
    }

    private static Grant grant(Record row) {
        return new Grant(
                Grant.Subject.valueOf(row.get(DOCUMENT_GRANT.SUBJECT_TYPE)),
                row.get(DOCUMENT_GRANT.SUBJECT_ID),
                Grant.Level.valueOf(row.get(DOCUMENT_GRANT.LEVEL)));
    }
}

package xyz.goraebap.productivity.issue.infrastructure;

import static xyz.goraebap.jooq.tables.Issue.ISSUE;
import static xyz.goraebap.jooq.tables.WorkItemType.WORK_ITEM_TYPE;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.jooq.tables.records.WorkItemTypeRecord;
import xyz.goraebap.productivity.issue.domain.type.WorkItemType;
import xyz.goraebap.productivity.issue.domain.type.WorkItemTypeRepository;

@Repository
@RequiredArgsConstructor
class JooqWorkItemTypeRepository implements WorkItemTypeRepository {
    private final DSLContext dslContext;

    @Override
    public List<WorkItemType> findAll() {
        return dslContext
                .selectFrom(WORK_ITEM_TYPE)
                .orderBy(WORK_ITEM_TYPE.POSITION, WORK_ITEM_TYPE.CODE)
                .fetch(JooqWorkItemTypeRepository::type);
    }

    @Override
    public Optional<WorkItemType> findByCode(String code) {
        return dslContext
                .selectFrom(WORK_ITEM_TYPE)
                .where(WORK_ITEM_TYPE.CODE.eq(code))
                .fetchOptional(JooqWorkItemTypeRepository::type);
    }

    @Override
    public boolean existsByNameAndCodeNot(String name, String code) {
        return dslContext.fetchExists(
                WORK_ITEM_TYPE,
                DSL.lower(WORK_ITEM_TYPE.NAME).eq(DSL.lower(DSL.val(name))).and(WORK_ITEM_TYPE.CODE.ne(code)));
    }

    @Override
    public int nextPosition() {
        return dslContext
                .select(DSL.coalesce(DSL.max(WORK_ITEM_TYPE.POSITION).plus(1), 0))
                .from(WORK_ITEM_TYPE)
                .fetchOptional(0, Integer.class)
                .orElse(0);
    }

    @Override
    public void save(WorkItemType type, UUID actor, Instant now) {
        dslContext
                .insertInto(WORK_ITEM_TYPE)
                .set(WORK_ITEM_TYPE.CODE, type.code())
                .set(WORK_ITEM_TYPE.NAME, type.name())
                .set(WORK_ITEM_TYPE.ICON, type.icon())
                .set(WORK_ITEM_TYPE.COLOR, type.color())
                .set(WORK_ITEM_TYPE.POSITION, type.position())
                .set(WORK_ITEM_TYPE.IS_DEFAULT, type.isDefault())
                .set(WORK_ITEM_TYPE.CREATED_AT, now)
                .set(WORK_ITEM_TYPE.CREATED_BY, actor)
                .set(WORK_ITEM_TYPE.UPDATED_AT, now)
                .set(WORK_ITEM_TYPE.UPDATED_BY, actor)
                .onConflict(WORK_ITEM_TYPE.CODE)
                .doUpdate()
                .set(WORK_ITEM_TYPE.NAME, type.name())
                .set(WORK_ITEM_TYPE.ICON, type.icon())
                .set(WORK_ITEM_TYPE.COLOR, type.color())
                .set(WORK_ITEM_TYPE.UPDATED_AT, now)
                .set(WORK_ITEM_TYPE.UPDATED_BY, actor)
                .execute();
    }

    @Override
    public void makeDefault(String code, UUID actor, Instant now) {
        dslContext
                .update(WORK_ITEM_TYPE)
                .set(WORK_ITEM_TYPE.IS_DEFAULT, WORK_ITEM_TYPE.CODE.eq(code))
                .set(WORK_ITEM_TYPE.UPDATED_AT, now)
                .set(WORK_ITEM_TYPE.UPDATED_BY, actor)
                .execute();
    }

    @Override
    public void reorder(List<String> codes, UUID actor, Instant now) {
        int position = 0;
        for (String code : codes)
            dslContext
                    .update(WORK_ITEM_TYPE)
                    .set(WORK_ITEM_TYPE.POSITION, position++)
                    .set(WORK_ITEM_TYPE.UPDATED_AT, now)
                    .set(WORK_ITEM_TYPE.UPDATED_BY, actor)
                    .where(WORK_ITEM_TYPE.CODE.eq(code))
                    .execute();
    }

    @Override
    public int countUses(String code) {
        return dslContext.fetchCount(ISSUE, ISSUE.TYPE.eq(code));
    }

    @Override
    public void delete(String code) {
        dslContext
                .deleteFrom(WORK_ITEM_TYPE)
                .where(WORK_ITEM_TYPE.CODE.eq(code))
                .execute();
    }

    private static WorkItemType type(WorkItemTypeRecord row) {
        return WorkItemType.fromPersistence(
                row.getCode(), row.getName(), row.getIcon(), row.getColor(), row.getPosition(), row.getIsDefault());
    }
}

package xyz.goraebap.productivity.richbody.infrastructure;

import static xyz.goraebap.jooq.tables.RichBlock.RICH_BLOCK;
import static xyz.goraebap.jooq.tables.RichBlockChange.RICH_BLOCK_CHANGE;
import static xyz.goraebap.jooq.tables.RichBody.RICH_BODY;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.productivity.richbody.domain.RichBlockRepository;

@Repository
@RequiredArgsConstructor
class JooqRichBlockRepository implements RichBlockRepository {
    private final DSLContext dslContext;

    @Override
    public List<Block> blocks(UUID ownerId) {
        return dslContext
                .select(RICH_BLOCK.BLOCK_ID, RICH_BLOCK.POSITION, RICH_BLOCK.NODE, RICH_BLOCK.VERSION)
                .from(RICH_BLOCK)
                .where(RICH_BLOCK.OWNER_ID.eq(ownerId))
                .orderBy(RICH_BLOCK.POSITION, RICH_BLOCK.BLOCK_ID)
                .fetch(row -> new Block(row.value1(), row.value2(), row.value3(), row.value4()));
    }

    @Override
    public void put(UUID ownerId, Collection<Block> blocks, UUID actor, Instant now) {
        if (blocks.isEmpty()) return;
        var queries = blocks.stream()
                .map(block -> dslContext
                        .insertInto(RICH_BLOCK)
                        .set(RICH_BLOCK.OWNER_ID, ownerId)
                        .set(RICH_BLOCK.BLOCK_ID, block.id())
                        .set(RICH_BLOCK.POSITION, block.position())
                        .set(RICH_BLOCK.NODE, block.node())
                        .set(RICH_BLOCK.VERSION, block.version())
                        .set(RICH_BLOCK.UPDATED_AT, now)
                        .set(RICH_BLOCK.UPDATED_BY, actor)
                        .onConflict(RICH_BLOCK.OWNER_ID, RICH_BLOCK.BLOCK_ID)
                        .doUpdate()
                        .set(RICH_BLOCK.POSITION, block.position())
                        .set(RICH_BLOCK.NODE, block.node())
                        .set(RICH_BLOCK.VERSION, block.version())
                        .set(RICH_BLOCK.UPDATED_AT, now)
                        .set(RICH_BLOCK.UPDATED_BY, actor))
                .toList();
        dslContext.batch(queries).execute();
    }

    @Override
    public void delete(UUID ownerId, Collection<String> blockIds) {
        if (blockIds.isEmpty()) return;
        dslContext
                .deleteFrom(RICH_BLOCK)
                .where(RICH_BLOCK.OWNER_ID.eq(ownerId).and(RICH_BLOCK.BLOCK_ID.in(blockIds)))
                .execute();
    }

    @Override
    public void log(UUID ownerId, long version, Collection<Change> changes, UUID actor, Instant now) {
        if (changes.isEmpty()) return;
        var queries = changes.stream()
                .map(change -> dslContext
                        .insertInto(RICH_BLOCK_CHANGE)
                        .set(RICH_BLOCK_CHANGE.OWNER_ID, ownerId)
                        .set(RICH_BLOCK_CHANGE.VERSION, version)
                        .set(RICH_BLOCK_CHANGE.BLOCK_ID, change.blockId())
                        .set(RICH_BLOCK_CHANGE.NODE, change.node())
                        .set(RICH_BLOCK_CHANGE.CHANGED_AT, now)
                        .set(RICH_BLOCK_CHANGE.CHANGED_BY, actor))
                .toList();
        dslContext.batch(queries).execute();
    }

    @Override
    public java.util.Set<String> changedSince(UUID ownerId, long version) {
        return dslContext
                .selectDistinct(RICH_BLOCK_CHANGE.BLOCK_ID)
                .from(RICH_BLOCK_CHANGE)
                .where(RICH_BLOCK_CHANGE.OWNER_ID.eq(ownerId).and(RICH_BLOCK_CHANGE.VERSION.gt(version)))
                .fetchSet(RICH_BLOCK_CHANGE.BLOCK_ID);
    }

    @Override
    public String attrs(UUID ownerId) {
        return dslContext
                .select(RICH_BODY.ATTRS)
                .from(RICH_BODY)
                .where(RICH_BODY.OWNER_ID.eq(ownerId))
                .fetchOptional(RICH_BODY.ATTRS)
                .orElse(null);
    }

    @Override
    public void saveAttrs(UUID ownerId, String attrs) {
        dslContext
                .update(RICH_BODY)
                .set(RICH_BODY.ATTRS, attrs)
                .where(RICH_BODY.OWNER_ID.eq(ownerId))
                .execute();
    }
}

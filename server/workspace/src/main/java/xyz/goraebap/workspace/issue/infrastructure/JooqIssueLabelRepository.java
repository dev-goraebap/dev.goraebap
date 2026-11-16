package xyz.goraebap.workspace.issue.infrastructure;

import static xyz.goraebap.workspace.jooq.tables.Issue.ISSUE;
import static xyz.goraebap.workspace.jooq.tables.IssueLabel.ISSUE_LABEL;
import static xyz.goraebap.workspace.jooq.tables.IssueLabelLink.ISSUE_LABEL_LINK;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.goraebap.workspace.jooq.tables.records.IssueLabelRecord;
import xyz.goraebap.workspace.issue.domain.label.IssueLabel;
import xyz.goraebap.workspace.issue.domain.label.IssueLabelRepository;

@Repository
@RequiredArgsConstructor
class JooqIssueLabelRepository implements IssueLabelRepository {
    private final DSLContext dslContext;

    @Override
    public List<IssueLabel> findAll() {
        return dslContext
                .selectFrom(ISSUE_LABEL)
                .orderBy(ISSUE_LABEL.POSITION, ISSUE_LABEL.LABEL_ID)
                .fetch(JooqIssueLabelRepository::label);
    }

    @Override
    public Optional<IssueLabel> findById(UUID id) {
        return dslContext
                .selectFrom(ISSUE_LABEL)
                .where(ISSUE_LABEL.LABEL_ID.eq(id))
                .fetchOptional(JooqIssueLabelRepository::label);
    }

    @Override
    public boolean existsByNameAndIdNot(String name, UUID id) {
        return dslContext.fetchExists(
                ISSUE_LABEL,
                DSL.lower(ISSUE_LABEL.NAME).eq(DSL.lower(DSL.val(name))).and(ISSUE_LABEL.LABEL_ID.ne(id)));
    }

    @Override
    public int nextPosition() {
        return dslContext
                .select(DSL.coalesce(DSL.max(ISSUE_LABEL.POSITION).plus(1), 0))
                .from(ISSUE_LABEL)
                .fetchOptional(0, Integer.class)
                .orElse(0);
    }

    @Override
    public void save(IssueLabel label, UUID actor, Instant now) {
        dslContext
                .insertInto(ISSUE_LABEL)
                .set(ISSUE_LABEL.LABEL_ID, label.id())
                .set(ISSUE_LABEL.NAME, label.name())
                .set(ISSUE_LABEL.COLOR, label.color())
                .set(ISSUE_LABEL.POSITION, label.position())
                .set(ISSUE_LABEL.CREATED_AT, now)
                .set(ISSUE_LABEL.CREATED_BY, actor)
                .set(ISSUE_LABEL.UPDATED_AT, now)
                .set(ISSUE_LABEL.UPDATED_BY, actor)
                .onConflict(ISSUE_LABEL.LABEL_ID)
                .doUpdate()
                .set(ISSUE_LABEL.NAME, label.name())
                .set(ISSUE_LABEL.COLOR, label.color())
                .set(ISSUE_LABEL.UPDATED_AT, now)
                .set(ISSUE_LABEL.UPDATED_BY, actor)
                .execute();
    }

    @Override
    public void reorder(List<UUID> ids, UUID actor, Instant now) {
        int position = 0;
        for (UUID id : ids)
            dslContext
                    .update(ISSUE_LABEL)
                    .set(ISSUE_LABEL.POSITION, position++)
                    .set(ISSUE_LABEL.UPDATED_AT, now)
                    .set(ISSUE_LABEL.UPDATED_BY, actor)
                    .where(ISSUE_LABEL.LABEL_ID.eq(id))
                    .execute();
    }

    @Override
    public int countUses(UUID id) {
        return dslContext.fetchCount(dslContext
                .select(ISSUE_LABEL_LINK.ISSUE_ID)
                .from(ISSUE_LABEL_LINK)
                .join(ISSUE)
                .on(ISSUE.ISSUE_ID.eq(ISSUE_LABEL_LINK.ISSUE_ID))
                .where(ISSUE_LABEL_LINK.LABEL_ID.eq(id).and(ISSUE.DELETED_AT.isNull())));
    }

    @Override
    public void deleteById(UUID id) {
        dslContext
                .deleteFrom(ISSUE_LABEL_LINK)
                .where(ISSUE_LABEL_LINK.LABEL_ID.eq(id))
                .execute();
        dslContext.deleteFrom(ISSUE_LABEL).where(ISSUE_LABEL.LABEL_ID.eq(id)).execute();
    }

    private static IssueLabel label(IssueLabelRecord row) {
        return IssueLabel.fromPersistence(row.getLabelId(), row.getName(), row.getColor(), row.getPosition());
    }
}

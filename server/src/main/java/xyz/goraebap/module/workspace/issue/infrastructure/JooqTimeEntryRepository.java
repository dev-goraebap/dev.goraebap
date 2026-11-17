package xyz.goraebap.module.workspace.issue.infrastructure;

import static xyz.goraebap.jooq.tables.IssueTimeEntry.ISSUE_TIME_ENTRY;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.jooq.tables.records.IssueTimeEntryRecord;
import xyz.goraebap.module.workspace.issue.domain.time.TimeEntry;
import xyz.goraebap.module.workspace.issue.domain.time.TimeEntryRepository;

@Repository
@RequiredArgsConstructor
class JooqTimeEntryRepository implements TimeEntryRepository {
    private final DSLContext dslContext;

    @Override
    public void save(TimeEntry entry, UUID actor) {
        dslContext
                .insertInto(ISSUE_TIME_ENTRY)
                .set(ISSUE_TIME_ENTRY.ENTRY_ID, entry.id())
                .set(ISSUE_TIME_ENTRY.ISSUE_ID, entry.issueId())
                .set(ISSUE_TIME_ENTRY.MEMBER_ID, entry.memberId())
                .set(ISSUE_TIME_ENTRY.SPENT_ON, entry.spentOn())
                .set(ISSUE_TIME_ENTRY.MINUTES, entry.minutes())
                .set(ISSUE_TIME_ENTRY.NOTE, entry.note())
                .set(ISSUE_TIME_ENTRY.CREATED_AT, entry.createdAt())
                .set(ISSUE_TIME_ENTRY.CREATED_BY, actor)
                .execute();
    }

    @Override
    public List<TimeEntry> findByIssueId(UUID issueId) {
        return dslContext
                .selectFrom(ISSUE_TIME_ENTRY)
                .where(ISSUE_TIME_ENTRY.ISSUE_ID.eq(issueId))
                .orderBy(ISSUE_TIME_ENTRY.SPENT_ON.desc(), ISSUE_TIME_ENTRY.CREATED_AT.desc())
                .fetch(JooqTimeEntryRepository::entry);
    }

    @Override
    public Optional<TimeEntry> findById(UUID id) {
        return dslContext
                .selectFrom(ISSUE_TIME_ENTRY)
                .where(ISSUE_TIME_ENTRY.ENTRY_ID.eq(id))
                .fetchOptional(JooqTimeEntryRepository::entry);
    }

    @Override
    public void delete(UUID id) {
        dslContext
                .deleteFrom(ISSUE_TIME_ENTRY)
                .where(ISSUE_TIME_ENTRY.ENTRY_ID.eq(id))
                .execute();
    }

    private static TimeEntry entry(IssueTimeEntryRecord row) {
        return new TimeEntry(
                row.getEntryId(),
                row.getIssueId(),
                row.getMemberId(),
                row.getSpentOn(),
                row.getMinutes(),
                row.getNote(),
                row.getCreatedAt());
    }
}

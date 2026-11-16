package xyz.goraebap.foundation.outbox.infrastructure;

import static org.jooq.impl.DSL.notExists;
import static org.jooq.impl.DSL.selectOne;
import static xyz.goraebap.foundation.jooq.tables.OutboxMessage.OUTBOX_MESSAGE;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.foundation.outbox.OutboxMessage;
import xyz.goraebap.foundation.outbox.domain.OutboxRepository;

@Repository
@RequiredArgsConstructor
class JooqOutboxRepository implements OutboxRepository {
    private static final String PENDING = "PENDING";
    private static final String DONE = "DONE";
    private static final String FAILED = "FAILED";

    private final DSLContext dslContext;

    @Override
    public void add(String topic, String orderingKey, String payload, Instant now) {
        dslContext
                .insertInto(OUTBOX_MESSAGE)
                .set(OUTBOX_MESSAGE.TOPIC, topic)
                .set(OUTBOX_MESSAGE.ORDERING_KEY, orderingKey)
                .set(OUTBOX_MESSAGE.PAYLOAD, payload)
                .set(OUTBOX_MESSAGE.STATUS, PENDING)
                .set(OUTBOX_MESSAGE.ATTEMPTS, 0)
                .set(OUTBOX_MESSAGE.NEXT_ATTEMPT_AT, now)
                .set(OUTBOX_MESSAGE.CREATED_AT, now)
                .execute();
    }

    @Override
    public List<OutboxMessage> findDue(Instant now, int limit) {
        var earlier = OUTBOX_MESSAGE.as("earlier");
        return dslContext
                .select(
                        OUTBOX_MESSAGE.OUTBOX_ID,
                        OUTBOX_MESSAGE.TOPIC,
                        OUTBOX_MESSAGE.ORDERING_KEY,
                        OUTBOX_MESSAGE.PAYLOAD,
                        OUTBOX_MESSAGE.ATTEMPTS)
                .from(OUTBOX_MESSAGE)
                .where(OUTBOX_MESSAGE.STATUS.eq(PENDING))
                .and(OUTBOX_MESSAGE.NEXT_ATTEMPT_AT.le(now))
                .and(OUTBOX_MESSAGE
                        .ORDERING_KEY
                        .isNull()
                        .or(notExists(selectOne()
                                .from(earlier)
                                .where(earlier.ORDERING_KEY.eq(OUTBOX_MESSAGE.ORDERING_KEY))
                                .and(earlier.OUTBOX_ID.lt(OUTBOX_MESSAGE.OUTBOX_ID))
                                .and(earlier.STATUS.in(PENDING, FAILED)))))
                .orderBy(OUTBOX_MESSAGE.OUTBOX_ID)
                .limit(limit)
                .fetch(row -> new OutboxMessage(row.value1(), row.value2(), row.value3(), row.value4(), row.value5()));
    }

    @Override
    public void markDone(long id, Instant now) {
        dslContext
                .update(OUTBOX_MESSAGE)
                .set(OUTBOX_MESSAGE.STATUS, DONE)
                .set(OUTBOX_MESSAGE.FINISHED_AT, now)
                .setNull(OUTBOX_MESSAGE.LAST_ERROR)
                .where(OUTBOX_MESSAGE.OUTBOX_ID.eq(key(id)))
                .execute();
    }

    @Override
    public void markRetry(long id, int attempts, Instant nextAttemptAt, String error) {
        dslContext
                .update(OUTBOX_MESSAGE)
                .set(OUTBOX_MESSAGE.ATTEMPTS, attempts)
                .set(OUTBOX_MESSAGE.NEXT_ATTEMPT_AT, nextAttemptAt)
                .set(OUTBOX_MESSAGE.LAST_ERROR, error)
                .where(OUTBOX_MESSAGE.OUTBOX_ID.eq(key(id)))
                .execute();
    }

    @Override
    public void markFailed(long id, int attempts, String error, Instant now) {
        dslContext
                .update(OUTBOX_MESSAGE)
                .set(OUTBOX_MESSAGE.STATUS, FAILED)
                .set(OUTBOX_MESSAGE.ATTEMPTS, attempts)
                .set(OUTBOX_MESSAGE.LAST_ERROR, error)
                .set(OUTBOX_MESSAGE.FINISHED_AT, now)
                .where(OUTBOX_MESSAGE.OUTBOX_ID.eq(key(id)))
                .execute();
    }

    @Override
    public List<FailedLine> findFailed(int limit) {
        return dslContext
                .select(
                        OUTBOX_MESSAGE.OUTBOX_ID,
                        OUTBOX_MESSAGE.TOPIC,
                        OUTBOX_MESSAGE.ORDERING_KEY,
                        OUTBOX_MESSAGE.ATTEMPTS,
                        OUTBOX_MESSAGE.LAST_ERROR,
                        OUTBOX_MESSAGE.CREATED_AT,
                        OUTBOX_MESSAGE.FINISHED_AT)
                .from(OUTBOX_MESSAGE)
                .where(OUTBOX_MESSAGE.STATUS.eq(FAILED))
                .orderBy(OUTBOX_MESSAGE.OUTBOX_ID)
                .limit(limit)
                .fetch(row -> new FailedLine(
                        row.value1(),
                        row.value2(),
                        row.value3(),
                        row.value4(),
                        row.value5(),
                        row.value6(),
                        row.value7()));
    }

    @Override
    public Optional<String> statusOf(long id) {
        return dslContext
                .select(OUTBOX_MESSAGE.STATUS)
                .from(OUTBOX_MESSAGE)
                .where(OUTBOX_MESSAGE.OUTBOX_ID.eq(key(id)))
                .fetchOptional(OUTBOX_MESSAGE.STATUS);
    }

    @Override
    public void reopen(long id, Instant now) {
        dslContext
                .update(OUTBOX_MESSAGE)
                .set(OUTBOX_MESSAGE.STATUS, PENDING)
                .set(OUTBOX_MESSAGE.ATTEMPTS, 0)
                .set(OUTBOX_MESSAGE.NEXT_ATTEMPT_AT, now)
                .setNull(OUTBOX_MESSAGE.FINISHED_AT)
                .where(OUTBOX_MESSAGE.OUTBOX_ID.eq(key(id)))
                .execute();
    }

    @Override
    public void delete(long id) {
        dslContext
                .deleteFrom(OUTBOX_MESSAGE)
                .where(OUTBOX_MESSAGE.OUTBOX_ID.eq(key(id)))
                .execute();
    }

    @Override
    public void deleteDoneBefore(Instant moment) {
        dslContext
                .deleteFrom(OUTBOX_MESSAGE)
                .where(OUTBOX_MESSAGE.STATUS.eq(DONE))
                .and(OUTBOX_MESSAGE.FINISHED_AT.lt(moment))
                .execute();
    }

    /** The column is SQLite's integer key, which the generated class reads as an Integer. */
    private static Integer key(long id) {
        return Math.toIntExact(id);
    }
}

package xyz.goraebap.foundation.outbox;

import java.time.Clock;
import javax.sql.DataSource;
import org.jooq.DSLContext;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import xyz.goraebap.foundation.outbox.domain.OutboxRepository;
import xyz.goraebap.foundation.outbox.infrastructure.JooqOutboxRepository;

/**
 * The outbox of one database. Each subproject that owns a database makes one over its own jOOQ context and
 * transaction manager (its migrations carry the outbox_message table), so a command's lines sit in the same file as
 * the command's other writes. The processor drains every channel the assembly has.
 */
public final class OutboxChannel implements Outbox {
    private static final int TOPIC_MAX = 64;
    private static final int KEY_MAX = 200;

    private final String name;
    private final OutboxRepository repository;
    private final TransactionTemplate transactions;
    private final DataSource dataSource;
    private final Clock clock;
    private final ApplicationEventPublisher events;

    public OutboxChannel(
            String name,
            DSLContext dsl,
            PlatformTransactionManager transactionManager,
            Clock clock,
            ApplicationEventPublisher events) {
        if (!(transactionManager instanceof DataSourceTransactionManager jdbc) || jdbc.getDataSource() == null)
            throw new IllegalArgumentException("an outbox channel needs its database's own transaction manager");
        this.name = name;
        this.repository = new JooqOutboxRepository(name, dsl);
        this.transactions = new TransactionTemplate(transactionManager);
        this.dataSource = jdbc.getDataSource();
        this.clock = clock;
        this.events = events;
    }

    /** Refuses outside a transaction on this channel's database: such a line could outlive a command that rolled back. */
    @Override
    public void add(String topic, String orderingKey, String payload) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || TransactionSynchronizationManager.getResource(dataSource) == null)
            throw new IllegalTransactionStateException(
                    "An outbox line is added inside a transaction on its own database: " + name);
        if (topic == null || topic.isBlank() || topic.length() > TOPIC_MAX)
            throw new IllegalArgumentException("outbox topic must be 1 to " + TOPIC_MAX + " characters");
        if (orderingKey != null && (orderingKey.isBlank() || orderingKey.length() > KEY_MAX))
            throw new IllegalArgumentException("outbox ordering key must be 1 to " + KEY_MAX + " characters");
        if (payload == null) throw new IllegalArgumentException("outbox payload is required");
        repository.add(topic, orderingKey, payload, clock.instant());
        events.publishEvent(new OutboxChanged());
    }

    public String name() {
        return name;
    }

    /** For the processor and the administrator's screen; nothing else reads or marks lines. */
    public OutboxRepository repository() {
        return repository;
    }

    /** Transactions on this channel's database. */
    public TransactionTemplate transactions() {
        return transactions;
    }

    /** Tells the processor to look once the running transaction commits. */
    public void changed() {
        events.publishEvent(new OutboxChanged());
    }
}

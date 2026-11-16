package xyz.goraebap.workspace;

import java.time.Clock;
import org.jooq.DSLContext;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;
import xyz.goraebap.foundation.outbox.OutboxChannel;
import xyz.goraebap.foundation.shared.persistence.SubprojectDatabase;

/**
 * The workspace's own database file. Its jOOQ context and transaction manager are named, never the default ones, so
 * the foundation keeps the plain DSLContext and @WorkspaceTransactional and nothing here reaches its file by accident.
 */
@Configuration(proxyBeanMethods = false)
public class WorkspaceDatabaseConfig {
    /** The qualifier of the workspace's DSLContext. */
    public static final String DSL = "workspace";

    public static final String TRANSACTION_MANAGER = "workspaceTransactionManager";

    @Bean(destroyMethod = "close")
    @Qualifier(DSL)
    SubprojectDatabase workspaceDatabase(@Value("${app.workspace.db:./data/workspace.db}") String file) {
        return SubprojectDatabase.open("workspace", file, "classpath:db/workspace");
    }

    @Bean(defaultCandidate = false)
    @Qualifier(DSL)
    DSLContext workspaceDsl(@Qualifier(DSL) SubprojectDatabase database) {
        return database.dsl();
    }

    /** The workspace's outbox, in its own file: what its commands leave for other subprojects to do. */
    @Bean
    @Qualifier(DSL)
    OutboxChannel workspaceOutbox(
            @Qualifier(DSL) SubprojectDatabase database, Clock clock, ApplicationEventPublisher events) {
        return new OutboxChannel(DSL, database.dsl(), database.transactionManager(), clock, events);
    }

    @Bean(name = TRANSACTION_MANAGER, defaultCandidate = false)
    PlatformTransactionManager workspaceTransactionManager(@Qualifier(DSL) SubprojectDatabase database) {
        return database.transactionManager();
    }
}

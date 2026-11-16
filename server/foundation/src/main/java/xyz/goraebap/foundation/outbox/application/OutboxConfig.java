package xyz.goraebap.foundation.outbox.application;

import java.time.Clock;
import org.jooq.DSLContext;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.transaction.PlatformTransactionManager;
import xyz.goraebap.foundation.outbox.OutboxChannel;

/** The foundation's own channel, over its database. It is the Outbox a foundation module gets when it asks for one. */
@Configuration(proxyBeanMethods = false)
class OutboxConfig {
    static final String CHANNEL = "foundation";

    @Bean
    @Primary
    OutboxChannel foundationOutbox(
            DSLContext dslContext,
            PlatformTransactionManager transactionManager,
            Clock clock,
            ApplicationEventPublisher events) {
        return new OutboxChannel(CHANNEL, dslContext, transactionManager, clock, events);
    }
}

package xyz.goraebap.foundation.notification.application;

import java.util.function.Consumer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;
import xyz.goraebap.foundation.notification.Notice;
import xyz.goraebap.foundation.notification.NotificationFacade;
import xyz.goraebap.foundation.notification.NotificationOutbox;
import xyz.goraebap.foundation.notification.Subject;
import xyz.goraebap.foundation.outbox.OutboxHandlerSpi;
import xyz.goraebap.foundation.outbox.OutboxMessage;
import xyz.goraebap.foundation.outbox.OutboxReceipts;

/**
 * Carries out the notices other subprojects left in their outboxes. Each runs in one transaction of the foundation's
 * database with the note that it was received, so a line handed over twice is sent once.
 */
@Configuration(proxyBeanMethods = false)
class NotificationOutboxHandlers {
    @Bean
    OutboxHandlerSpi notificationSendHandler(
            NotificationFacade notifications,
            OutboxReceipts receipts,
            PlatformTransactionManager transactionManager,
            JsonMapper jsonMapper) {
        var transactions = new TransactionTemplate(transactionManager);
        return handler(NotificationOutbox.SEND, message -> transactions.executeWithoutResult(status -> {
            if (receipts.first(message)) notifications.send(jsonMapper.readValue(message.payload(), Notice.class));
        }));
    }

    @Bean
    OutboxHandlerSpi notificationClosedHandler(
            NotificationFacade notifications,
            OutboxReceipts receipts,
            PlatformTransactionManager transactionManager,
            JsonMapper jsonMapper) {
        var transactions = new TransactionTemplate(transactionManager);
        return handler(NotificationOutbox.CLOSED, message -> transactions.executeWithoutResult(status -> {
            if (receipts.first(message)) notifications.closed(jsonMapper.readValue(message.payload(), Subject.class));
        }));
    }

    private static OutboxHandlerSpi handler(String topic, Consumer<OutboxMessage> body) {
        return new OutboxHandlerSpi() {
            @Override
            public String topic() {
                return topic;
            }

            @Override
            public void handle(OutboxMessage message) {
                body.accept(message);
            }
        };
    }
}

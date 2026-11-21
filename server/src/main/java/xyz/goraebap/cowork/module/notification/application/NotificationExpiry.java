package xyz.goraebap.cowork.module.notification.application;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Every minute marks read the notices whose time has passed, so a reminder for an event that already started stops
 * counting. app.jobs.enabled=false turns it off, as in tests.
 */
@Component
@ConditionalOnProperty(name = "app.jobs.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
class NotificationExpiry {
    private final NotificationService notificationService;

    @Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT1M")
    void expire() {
        notificationService.expire();
    }
}

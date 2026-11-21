package xyz.goraebap.foundation.system.infrastructure;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Keeps the log database to 30 days every night and copies it every Sunday. app.jobs.enabled=false turns it off. */
@Component
@ConditionalOnProperty(name = "app.jobs.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
class LogMaintenanceScheduler {
    private final LogMaintenance maintenance;

    @Scheduled(cron = "0 50 3 * * *", zone = "Asia/Seoul")
    void forget() {
        maintenance.forget();
    }

    @Scheduled(cron = "0 20 4 * * SUN", zone = "Asia/Seoul")
    void backUp() {
        maintenance.backUp();
    }
}

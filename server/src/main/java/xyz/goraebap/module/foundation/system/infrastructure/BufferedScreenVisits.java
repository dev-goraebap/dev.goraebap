package xyz.goraebap.module.foundation.system.infrastructure;

import java.time.Clock;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import xyz.goraebap.module.foundation.system.application.ScreenVisitRecorder;
import xyz.goraebap.module.foundation.system.domain.ScreenVisit;

/** Queues a screen visit for the log writer, which joins it to the member's last visit of that screen. */
@Component
@RequiredArgsConstructor
class BufferedScreenVisits implements ScreenVisitRecorder {
    private final LogBuffer buffer;
    private final Clock clock;

    @Override
    public void record(UUID userId, String screen, String ip, String userAgent) {
        buffer.offer(new ScreenVisit(clock.instant(), userId, screen, ip, userAgent));
    }
}

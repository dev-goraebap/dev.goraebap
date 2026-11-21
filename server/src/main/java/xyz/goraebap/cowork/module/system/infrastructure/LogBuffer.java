package xyz.goraebap.cowork.module.system.infrastructure;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import xyz.goraebap.cowork.module.system.domain.LogEntry;

/**
 * Where requests and the logger leave their records for the writer. Offering never waits and never fails: when the
 * writer has fallen this far behind (the store failing for a while), the record is dropped and counted as lost, so a
 * request never slows down for its own record.
 */
@Component
@RequiredArgsConstructor
class LogBuffer {
    private static final int CAPACITY = 20_000;

    private final BlockingQueue<LogEntry> queue = new ArrayBlockingQueue<>(CAPACITY);
    private final LogDatabase database;

    void offer(LogEntry entry) {
        if (!queue.offer(entry)) database.lose(1);
    }

    /** Takes up to max waiting records, oldest first. */
    List<LogEntry> drain(int max) {
        var taken = new ArrayList<LogEntry>();
        queue.drainTo(taken, max);
        return taken;
    }
}

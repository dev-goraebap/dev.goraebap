package xyz.goraebap.foundation.outbox.application;

import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import xyz.goraebap.foundation.outbox.OutboxChannel;

/** Lets an administrator see the lines that failed, in every channel, and try them again or drop them. */
@Service
public class OutboxService {
    private static final int FAILED_SHOWN = 200;

    private final List<OutboxChannel> channels;
    private final Clock clock;

    OutboxService(List<OutboxChannel> channels, Clock clock) {
        this.channels = List.copyOf(channels);
        this.clock = clock;
    }

    public List<OutboxViews.FailedLine> failed() {
        var lines = new ArrayList<OutboxViews.FailedLine>();
        for (var channel : channels) {
            var found = channel.transactions().execute(status -> channel.repository().findFailed(FAILED_SHOWN));
            if (found == null) continue;
            for (var line : found)
                lines.add(new OutboxViews.FailedLine(
                        channel.name(),
                        line.id(),
                        line.topic(),
                        line.orderingKey(),
                        line.attempts(),
                        line.lastError(),
                        line.createdAt(),
                        line.failedAt()));
        }
        return lines;
    }

    /** A failed line starts over from its first attempt; the lines waiting behind it follow once it is done. */
    public void retry(String channelName, long id) {
        var channel = channel(channelName);
        channel.transactions().executeWithoutResult(status -> {
            requireFailed(channel, id);
            channel.repository().reopen(id, clock.instant());
            channel.changed();
        });
    }

    /** Drops a failed line for good, which lets the lines waiting behind it go on. */
    public void discard(String channelName, long id) {
        var channel = channel(channelName);
        channel.transactions().executeWithoutResult(status -> {
            requireFailed(channel, id);
            channel.repository().delete(id);
            channel.changed();
        });
    }

    private OutboxChannel channel(String name) {
        return channels.stream()
                .filter(each -> each.name().equals(name))
                .findFirst()
                .orElseThrow(OutboxErrorCode.OUTBOX_NOT_FOUND::raise);
    }

    private static void requireFailed(OutboxChannel channel, long id) {
        String status = channel.repository().statusOf(id).orElseThrow(OutboxErrorCode.OUTBOX_NOT_FOUND::raise);
        if (!status.equals("FAILED")) throw OutboxErrorCode.OUTBOX_NOT_FAILED.raise();
    }
}

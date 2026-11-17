package xyz.goraebap.module.foundation.realtime.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

class SseSignalChannelTest {
    private static final UUID MEMBER = UUID.randomUUID();

    @Test
    void aStreamThePhoneAlreadyClosedIsDroppedWithoutStoppingTheOthers() {
        var channel = new SseSignalChannel();
        var gone = new Stream();
        var open = new Stream();
        channel.attach(MEMBER, false, gone);
        channel.attach(MEMBER, false, open);
        // The phone closed its connection and the container already ended that request.
        gone.closed = true;

        assertThatCode(channel::keepAlive).doesNotThrowAnyException();
        assertThat(gone.endAttempts.get()).isEqualTo(1);
        assertThat(open.sent.get()).isEqualTo(2);

        // The closed stream is forgotten; the open one keeps getting events.
        channel.keepAlive();
        assertThat(gone.endAttempts.get()).isEqualTo(1);
        assertThat(open.sent.get()).isEqualTo(3);
    }

    /** A stream that counts what it takes, and once closed fails to take more and refuses to be ended again. */
    private static final class Stream extends SseEmitter {
        volatile boolean closed;
        final AtomicInteger sent = new AtomicInteger();
        final AtomicInteger endAttempts = new AtomicInteger();

        @Override
        public void send(SseEventBuilder builder) throws IOException {
            if (closed) throw new IOException("Broken pipe");
            sent.incrementAndGet();
        }

        @Override
        public synchronized void completeWithError(Throwable ex) {
            endAttempts.incrementAndGet();
            throw new IllegalStateException("A non-container (application) thread attempted to use the AsyncContext");
        }
    }
}

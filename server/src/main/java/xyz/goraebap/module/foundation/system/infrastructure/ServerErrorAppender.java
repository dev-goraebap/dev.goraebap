package xyz.goraebap.module.foundation.system.infrastructure;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.LoggerContextListener;
import ch.qos.logback.classic.spi.ThrowableProxyUtil;
import ch.qos.logback.core.AppenderBase;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import xyz.goraebap.module.foundation.system.domain.ServerErrorEntry;
import xyz.goraebap.shared.web.TraceIdFilter;

/**
 * Takes the server errors from the logger itself, so no feature records its own: every ERROR, and the warnings of this
 * application's own code (a library's warnings are mostly noise). What the request filter put into the logging
 * context says which request it happened in.
 *
 * <p>This module's own logs are left out, or a failing store would record its own failure into itself. Setting logging
 * up again (Spring Boot stops and resets it as an application context starts) drops every appender and listener, so
 * this one attaches itself again on a reset it hears of, and the writer checks it is still attached before each
 * write ({@link #ensureAttached()}).
 */
@Component
class ServerErrorAppender extends AppenderBase<ILoggingEvent> implements LoggerContextListener {
    private static final String NAME = "SYSTEM_STATUS";
    private static final String OWN = "xyz.goraebap.";
    private static final String SELF = "xyz.goraebap.module.foundation.system.";

    private final LogBuffer buffer;

    ServerErrorAppender(LogBuffer buffer) {
        this.buffer = buffer;
        setName(NAME + "-" + System.identityHashCode(this));
    }

    @PostConstruct
    void attach() {
        if (!(LoggerFactory.getILoggerFactory() instanceof LoggerContext context)) return;
        setContext(context);
        context.addListener(this);
        attachTo(context);
    }

    @PreDestroy
    void detach() {
        if (LoggerFactory.getILoggerFactory() instanceof LoggerContext context) {
            context.removeListener(this);
            context.getLogger(Logger.ROOT_LOGGER_NAME).detachAppender(this);
        }
        stop();
    }

    /** Attaches this appender again if a new logging setup dropped it. */
    void ensureAttached() {
        if (!(LoggerFactory.getILoggerFactory() instanceof LoggerContext context)) return;
        if (context.getLogger(Logger.ROOT_LOGGER_NAME).getAppender(getName()) == this) return;
        setContext(context);
        if (!context.getCopyOfListenerList().contains(this)) context.addListener(this);
        attachTo(context);
    }

    private void attachTo(LoggerContext context) {
        start();
        var root = context.getLogger(Logger.ROOT_LOGGER_NAME);
        if (root.getAppender(getName()) != this) root.addAppender(this);
    }

    @Override
    public boolean isResetResistant() {
        return true;
    }

    @Override
    public void onReset(LoggerContext context) {
        attachTo(context);
    }

    @Override
    public void onStart(LoggerContext context) {
        attachTo(context);
    }

    @Override
    public void onStop(LoggerContext context) {
        // The logging is going away with the server.
    }

    @Override
    public void onLevelChange(Logger logger, Level level) {
        // Levels do not change what is taken.
    }

    @Override
    protected void append(ILoggingEvent event) {
        String logger = event.getLoggerName();
        if (logger.startsWith(SELF)) return;
        boolean error = event.getLevel().isGreaterOrEqual(Level.ERROR);
        boolean ownWarning = event.getLevel().equals(Level.WARN) && logger.startsWith(OWN);
        if (!error && !ownWarning) return;
        try {
            var thrown = event.getThrowableProxy();
            Map<String, String> context = event.getMDCPropertyMap();
            buffer.offer(new ServerErrorEntry(
                    Instant.ofEpochMilli(event.getTimeStamp()),
                    event.getLevel().toString(),
                    cut(logger, 200),
                    cut(String.valueOf(event.getFormattedMessage()), 1000),
                    thrown == null ? null : cut(thrown.getClassName(), 200),
                    thrown == null ? null : cut(ThrowableProxyUtil.asString(thrown), 8000),
                    context.get(TraceIdFilter.MDC_KEY),
                    context.get(RequestRecordingFilter.MDC_METHOD),
                    cut(context.get(RequestRecordingFilter.MDC_PATH), 300),
                    userOf(context.get(RequestRecordingFilter.MDC_USER)),
                    context.get(RequestRecordingFilter.MDC_IP)));
        } catch (RuntimeException ignored) {
            // The logger must never fail because its copy could not be made.
        }
    }

    private static UUID userOf(String id) {
        try {
            return id == null ? null : UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String cut(String text, int max) {
        return text == null || text.length() <= max ? text : text.substring(0, max);
    }
}

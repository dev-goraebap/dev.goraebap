package xyz.goraebap.foundation.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;
import xyz.goraebap.foundation.outbox.Outbox;

/**
 * How a subproject with its own database sends notices: it leaves them in its own outbox, inside the command's
 * transaction, and they are sent once that commits. NotificationFacade joins the foundation's transaction, which such
 * a command does not have.
 */
@Component
@RequiredArgsConstructor
public class NotificationOutbox {
    public static final String SEND = "notification.send";
    public static final String CLOSED = "notification.closed";

    private final JsonMapper jsonMapper;

    /** Sent after the caller's transaction commits; nothing is left when nobody is to be told. */
    public void send(Outbox outbox, Notice notice) {
        if (notice.recipients().isEmpty()) return;
        outbox.add(SEND, key(notice.subject()), jsonMapper.writeValueAsString(notice));
    }

    /** The subject is gone or finished: every notice about it is done with. Ordered with the notices about it. */
    public void closed(Outbox outbox, Subject subject) {
        outbox.add(CLOSED, key(subject), jsonMapper.writeValueAsString(subject));
    }

    private static String key(Subject subject) {
        return "notification:" + subject.type() + ":" + subject.id();
    }
}

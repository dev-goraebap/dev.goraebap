package xyz.goraebap.module.foundation.notification;

import java.util.UUID;

/**
 * Leaves a notice for people inside the caller's transaction, so it exists exactly when the change it reports does,
 * and settles notices once their purpose is met, so the bell stops counting what the member no longer needs to look at.
 */
public interface NotificationFacade {
    void send(Notice notice);

    /** The member saw the subject: their notices about it that only tell them something are done with. */
    void seen(UUID recipientId, Subject subject);

    /** The member did what was asked about the subject: all their notices about it are done with. */
    void done(UUID recipientId, Subject subject);

    /** The subject is gone (a deleted notice): everyone's notices about it are done with. */
    void closed(Subject subject);
}

package xyz.goraebap.module.foundation.notification.application;

import xyz.goraebap.module.foundation.notification.domain.push.PushSubscription;

/** Sends one push to one browser through its push service, signed with this service's VAPID key. */
public interface PushGateway {
    /** Whether a VAPID key is set; without one nothing is pushed and browsers are not asked to subscribe. */
    boolean isConfigured();

    /** The VAPID public key browsers subscribe with, URL-safe Base64 without padding; null when not configured. */
    String publicKey();

    PushAnswer send(PushSubscription subscription, PushMessage message);

    /** What the notification shows: the service's name, one line under it, the screen it opens, and the tag grouping it. */
    /** test marks a test push, which the device always shows: it is how a member sees that this device gets them. */
    record PushMessage(String title, String body, String url, String tag, boolean test) {}

    /**
     * The push service's answer: its HTTP status (0 when it could not be reached) with a short reason on failure, and
     * whether trying again later may help (no answer, too many requests, the service's own trouble).
     */
    record PushAnswer(int httpStatus, String error, boolean retriable) {}
}

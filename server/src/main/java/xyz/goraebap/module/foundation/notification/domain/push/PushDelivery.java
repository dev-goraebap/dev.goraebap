package xyz.goraebap.module.foundation.notification.domain.push;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import xyz.goraebap.shared.domain.ValueObject;

/**
 * One push a notice (or a test) asked for: to one device of a recipient, or a note that none went and why. A PENDING
 * push is tried until the push service takes it (SENT), says the device is gone (GONE), or refuses it for good or
 * MAX_ATTEMPTS times (FAILED); each try keeps the service's answer.
 */
public record PushDelivery(
        UUID id,
        UUID eventId,
        UUID recipientId,
        UUID subscriptionId,
        String title,
        String link,
        Status status,
        int attempts,
        Integer httpStatus,
        String error,
        Instant createdAt,
        Instant attemptedAt)
        implements ValueObject {
    public static final int MAX_ATTEMPTS = 3;
    public static final int TITLE_MAX = 200;
    public static final int LINK_MAX = 500;
    public static final int ERROR_MAX = 500;

    public enum Status {
        PENDING,
        SENT,
        FAILED,
        GONE,
        NO_DEVICE,
        MUTED
    }

    public static PushDelivery pending(
            UUID id, UUID eventId, UUID recipientId, UUID subscriptionId, String title, String link, Instant now) {
        return new PushDelivery(
                id,
                eventId,
                recipientId,
                subscriptionId,
                cut(title, TITLE_MAX),
                cut(link, LINK_MAX),
                Status.PENDING,
                0,
                null,
                null,
                now,
                null);
    }

    /** The recipient had no device taking pushes, or had turned this group off: nothing went, and it says why. */
    public static PushDelivery skipped(
            UUID id, UUID eventId, UUID recipientId, String title, String link, Status why, Instant now) {
        if (why != Status.NO_DEVICE && why != Status.MUTED)
            throw new IllegalArgumentException("skipped only as NO_DEVICE or MUTED");
        return new PushDelivery(
                id,
                eventId,
                recipientId,
                null,
                cut(title, TITLE_MAX),
                cut(link, LINK_MAX),
                why,
                0,
                null,
                null,
                now,
                null);
    }

    /** The push service's answer to one try: taken, gone, worth trying again later, or refused for good. */
    public PushDelivery answered(int httpStatus, String error, boolean retriable, Instant now) {
        int tries = attempts + 1;
        Status next = httpStatus >= 200 && httpStatus < 300
                ? Status.SENT
                : httpStatus == 404 || httpStatus == 410
                        ? Status.GONE
                        : retriable && tries < MAX_ATTEMPTS ? Status.PENDING : Status.FAILED;
        return new PushDelivery(
                id,
                eventId,
                recipientId,
                subscriptionId,
                title,
                link,
                next,
                tries,
                httpStatus == 0 ? null : httpStatus,
                next == Status.SENT ? null : cut(error, ERROR_MAX),
                createdAt,
                now);
    }

    /** Nothing to send to any more: the device was turned off before its turn came. */
    public PushDelivery gone(Instant now) {
        return new PushDelivery(
                id,
                eventId,
                recipientId,
                subscriptionId,
                title,
                link,
                Status.GONE,
                attempts,
                httpStatus,
                "기기 구독이 끝났습니다",
                createdAt,
                now);
    }

    /** A retried push waits a minute more after each failed try. */
    public boolean isDue(Instant now) {
        return status == Status.PENDING
                && (attemptedAt == null
                        || !attemptedAt.plus(Duration.ofMinutes(attempts)).isAfter(now));
    }

    private static String cut(String value, int max) {
        if (value == null) return null;
        return value.length() > max ? value.substring(0, max) : value;
    }
}

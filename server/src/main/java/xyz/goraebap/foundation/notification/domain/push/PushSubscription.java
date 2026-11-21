package xyz.goraebap.foundation.notification.domain.push;

import java.net.URI;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import xyz.goraebap.shared.domain.ValueObject;
import xyz.goraebap.shared.error.DomainRuleViolation;

/**
 * A browser on a device that agreed to take pushes for a member: the push service's endpoint and the keys the browser
 * gave to encrypt for it (p256dh, its public key; auth, its secret), with the device's name as the member's browser
 * told it. An ended subscription (expiredAt) is kept for the record but no longer sent to.
 */
public record PushSubscription(
        UUID id,
        UUID userId,
        String endpoint,
        String p256dh,
        String auth,
        String userAgent,
        String deviceName,
        Instant createdAt,
        Instant lastSeenAt,
        Instant expiredAt)
        implements ValueObject {
    public static final int ENDPOINT_MAX = 2000;
    public static final int NAME_MAX = 100;
    public static final int AGENT_MAX = 500;

    public static PushSubscription create(
            UUID id,
            UUID userId,
            String endpoint,
            String p256dh,
            String auth,
            String userAgent,
            String deviceName,
            Instant now) {
        return new PushSubscription(
                id,
                userId,
                validEndpoint(endpoint),
                validKey(p256dh, 65),
                validKey(auth, 16),
                cut(userAgent, AGENT_MAX),
                cut(deviceName, NAME_MAX),
                now,
                now,
                null);
    }

    /**
     * The same browser again, perhaps signed in as someone else now, with the keys it gives today: it takes pushes for
     * that member from now on and counts as seen.
     */
    public PushSubscription renewedFor(
            UUID member, String p256dh, String auth, String userAgent, String deviceName, Instant now) {
        return new PushSubscription(
                id,
                member,
                endpoint,
                validKey(p256dh, 65),
                validKey(auth, 16),
                cut(userAgent, AGENT_MAX),
                deviceName == null || deviceName.isBlank() ? this.deviceName : cut(deviceName, NAME_MAX),
                createdAt,
                now,
                null);
    }

    /** Turned off by the member, or refused by the push service as gone. */
    public PushSubscription ended(Instant now) {
        return expiredAt != null
                ? this
                : new PushSubscription(
                        id, userId, endpoint, p256dh, auth, userAgent, deviceName, createdAt, lastSeenAt, now);
    }

    public boolean isActive() {
        return expiredAt == null;
    }

    private static String validEndpoint(String endpoint) {
        String value = endpoint == null ? "" : endpoint.strip();
        URI uri;
        try {
            uri = URI.create(value);
        } catch (IllegalArgumentException e) {
            throw new DomainRuleViolation("푸시 주소가 올바르지 않습니다");
        }
        if (!"https".equals(uri.getScheme()) || uri.getHost() == null || value.length() > ENDPOINT_MAX)
            throw new DomainRuleViolation("푸시 주소가 올바르지 않습니다");
        return value;
    }

    private static String validKey(String key, int length) {
        try {
            if (key != null && Base64.getUrlDecoder().decode(key.strip().replace("=", "")).length == length)
                return key.strip().replace("=", "");
        } catch (IllegalArgumentException ignored) {
            // Reported below as any other malformed key.
        }
        throw new DomainRuleViolation("푸시 키가 올바르지 않습니다");
    }

    private static String cut(String value, int max) {
        if (value == null || value.isBlank()) return null;
        String trimmed = value.strip();
        return trimmed.length() > max ? trimmed.substring(0, max) : trimmed;
    }
}

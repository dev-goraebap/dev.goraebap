package xyz.goraebap.foundation.notification.application;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import xyz.goraebap.foundation.notification.domain.push.PushTopic;

public final class PushViews {
    private PushViews() {}

    /** Whether pushing is set up here, and the key a browser subscribes with. */
    public record PushConfig(boolean enabled, String publicKey) {}

    /** How the last push to a device went: its status, when it was tried (or made), and why it failed. */
    public record PushLastResult(String status, Instant at, String error) {}

    /** A browser taking pushes, with how the last push to it went; ended ones show only in an administrator's history. */
    public record PushDevice(
            UUID id,
            String deviceName,
            String userAgent,
            Instant createdAt,
            Instant lastSeenAt,
            Instant expiredAt,
            PushLastResult lastPush) {}

    public record PushTopicSetting(PushTopic topic, boolean enabled) {}

    /** Every group of notices with whether the member takes it as a push. */
    public record PushPreferences(List<PushTopicSetting> topics) {
        public PushPreferences {
            topics = List.copyOf(topics);
        }
    }

    public record PushTestQueued(int devices) {}

    /** The last seven days of pushing across the company, with how many working members have a device. */
    public record PushSummary(
            boolean configured,
            long activeDevices,
            long membersWithDevice,
            long workingMembers,
            long sent,
            long failed,
            long gone,
            long noDevice,
            long muted,
            long pending) {}

    /** One working member's pushing over the last seven days: their devices, the latest push and the counts. */
    public record PushMemberRow(
            UUID id,
            String name,
            String affiliationName,
            long devices,
            Instant lastPushAt,
            String lastStatus,
            long sent,
            long failed,
            long noDevice) {}

    /** One push to a member: to which device, what it said, and how it went. test is true for a test push. */
    public record PushDeliveryRow(
            UUID id,
            String title,
            String link,
            String status,
            Integer httpStatus,
            String error,
            int attempts,
            Instant createdAt,
            Instant attemptedAt,
            UUID subscriptionId,
            String deviceName,
            boolean test) {}

    /** A member's devices, ended ones too, and their latest pushes, for an administrator. */
    public record PushMemberDetail(
            UUID id, String name, String affiliationName, List<PushDevice> devices, List<PushDeliveryRow> deliveries) {
        public PushMemberDetail {
            devices = List.copyOf(devices);
            deliveries = List.copyOf(deliveries);
        }
    }

    /**
     * One kind of notice as sent so far: over the last thirty days how many were made, how many people they reached and
     * how many pushes arrived; when the latest went out and what it said, to show what the kind reads like.
     */
    public record NoticeKindRow(
            String kind,
            long notices,
            long recipients,
            long pushed,
            Instant lastAt,
            String exampleTitle,
            String exampleMessage,
            String exampleLink) {}
}

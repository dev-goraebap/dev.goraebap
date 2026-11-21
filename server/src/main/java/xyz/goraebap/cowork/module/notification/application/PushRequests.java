package xyz.goraebap.cowork.module.notification.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import xyz.goraebap.cowork.module.notification.domain.push.PushTopic;

public final class PushRequests {
    private PushRequests() {}

    /** A browser's subscription as PushSubscription.toJSON gives it, with the name the page gave its device. */
    public record PushSubscribe(
            @NotBlank @Size(max = 2000) String endpoint,
            @NotBlank @Size(max = 200) String p256dh,
            @NotBlank @Size(max = 100) String auth,
            @Size(max = 100) String deviceName,
            @Size(max = 500) String userAgent) {}

    /** The groups the member turns off; every other group is on. */
    public record PushPreferencesChange(
            @NotNull @Size(max = 10) List<PushTopic> mutedTopics) {
        public PushPreferencesChange {
            mutedTopics = mutedTopics == null ? null : List.copyOf(mutedTopics);
        }
    }

    /** One device of the member's, or every one when no id is given. */
    public record PushTestRequest(UUID subscriptionId) {}

    public enum PushMemberState {
        ALL,
        FAILED,
        NO_DEVICE
    }

    /** Working members by name (q), narrowed to those with a failed push or without a device in the last seven days. */
    public record PushMemberListing(@Size(max = 100) String q, PushMemberState state) {
        public PushMemberListing {
            q = q == null || q.isBlank() ? null : q.strip();
            state = state == null ? PushMemberState.ALL : state;
        }
    }
}

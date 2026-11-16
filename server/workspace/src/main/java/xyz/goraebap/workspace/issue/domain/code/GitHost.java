package xyz.goraebap.workspace.issue.domain.code;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * One host's API and webhooks (BIT D-028, D-087), behind which each adapter speaks its own REST and payloads. Calls go
 * out over the network and are never made inside a transaction. A refused or failed call throws {@link GitHostException}.
 */
public interface GitHost {
    Provider provider();

    /** Checks the token reaches the repository; what the repository is called and whose token it is. */
    Remote.Repository verify(Remote.Connection connection);

    /** Registers the webhook; its id, or empty when the token may not (the manager registers it then). */
    Optional<String> createWebhook(Remote.Connection connection, String url, String secret);

    void deleteWebhook(Remote.Connection connection, String webhookId);

    /** Whether a delivery is signed with the secret. headers are lower-cased names. */
    boolean signed(Map<String, String> headers, byte[] body, String secret);

    /** What a delivery says happened, in common terms; empty for what is not followed. */
    List<Remote.Event> read(Map<String, String> headers, byte[] body);
}

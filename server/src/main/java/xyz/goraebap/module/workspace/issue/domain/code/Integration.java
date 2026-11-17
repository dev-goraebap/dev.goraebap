package xyz.goraebap.module.workspace.issue.domain.code;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;

/**
 * A project's repository on a host (BIT D-087): where it is, its token (none when it was connected by hand) and webhook
 * secret sealed, the webhook the server registered on the host (if it could), and when a delivery last came and what
 * went wrong with it.
 */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Integration {
    public static final int ERROR_MAX = 500;

    @EqualsAndHashCode.Include
    private final UUID id;

    private final UUID projectId;
    private final Provider provider;
    private final String baseUrl;
    private final String repository;
    private final String externalRepositoryId;
    private final String webUrl;
    private String tokenCipher;
    private final String webhookSecretCipher;
    private String webhookId;
    private String accountLogin;
    private Instant lastEventAt;
    private String lastError;
    private long version;
    private Instant updatedAt;
    private UUID updatedBy;

    public static Integration create(
            UUID id,
            UUID projectId,
            Provider provider,
            String baseUrl,
            String repository,
            String externalRepositoryId,
            String webUrl,
            String tokenCipher,
            String webhookSecretCipher,
            String accountLogin,
            UUID actor,
            Instant now) {
        return new Integration(
                id,
                projectId,
                provider,
                baseUrl,
                repository,
                externalRepositoryId,
                webUrl,
                tokenCipher,
                webhookSecretCipher,
                null,
                accountLogin,
                null,
                null,
                0,
                now,
                actor);
    }

    public static Integration fromPersistence(
            UUID id,
            UUID projectId,
            Provider provider,
            String baseUrl,
            String repository,
            String externalRepositoryId,
            String webUrl,
            String tokenCipher,
            String webhookSecretCipher,
            String webhookId,
            String accountLogin,
            Instant lastEventAt,
            String lastError,
            long version,
            Instant updatedAt,
            UUID updatedBy) {
        return new Integration(
                id,
                projectId,
                provider,
                baseUrl,
                repository,
                externalRepositoryId,
                webUrl,
                tokenCipher,
                webhookSecretCipher,
                webhookId,
                accountLogin,
                lastEventAt,
                lastError,
                version,
                updatedAt,
                updatedBy);
    }

    public boolean hasToken() {
        return tokenCipher != null;
    }

    public void registeredWebhook(String webhookId) {
        this.webhookId = webhookId;
    }

    public void replaceToken(String tokenCipher, String accountLogin, UUID actor, Instant now) {
        this.tokenCipher = tokenCipher;
        this.accountLogin = accountLogin;
        this.updatedAt = now;
        this.updatedBy = actor;
    }

    /** A delivery came; what went wrong applying it, or null when nothing did. */
    public void heard(Instant at, String error) {
        this.lastEventAt = at;
        this.lastError = error == null || error.length() <= ERROR_MAX ? error : error.substring(0, ERROR_MAX);
    }
}

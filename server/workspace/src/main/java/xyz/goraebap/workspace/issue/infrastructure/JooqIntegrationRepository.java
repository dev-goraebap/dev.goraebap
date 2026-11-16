package xyz.goraebap.workspace.issue.infrastructure;

import static xyz.goraebap.workspace.jooq.tables.IntegrationRule.INTEGRATION_RULE;
import static xyz.goraebap.workspace.jooq.tables.RepositoryIntegration.REPOSITORY_INTEGRATION;

import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.workspace.jooq.tables.records.RepositoryIntegrationRecord;
import xyz.goraebap.workspace.issue.domain.code.Integration;
import xyz.goraebap.workspace.issue.domain.code.IntegrationRepository;
import xyz.goraebap.workspace.issue.domain.code.Provider;
import xyz.goraebap.workspace.issue.domain.code.RuleEvent;

@Repository
@RequiredArgsConstructor
class JooqIntegrationRepository implements IntegrationRepository {
    private final DSLContext dslContext;

    @Override
    public Optional<Integration> findById(UUID id) {
        return dslContext
                .selectFrom(REPOSITORY_INTEGRATION)
                .where(REPOSITORY_INTEGRATION.INTEGRATION_ID.eq(id))
                .fetchOptional(JooqIntegrationRepository::integration);
    }

    @Override
    public List<Integration> findAllByProjectId(UUID projectId) {
        return dslContext
                .selectFrom(REPOSITORY_INTEGRATION)
                .where(REPOSITORY_INTEGRATION.PROJECT_ID.eq(projectId))
                .orderBy(REPOSITORY_INTEGRATION.CREATED_AT)
                .fetch(JooqIntegrationRepository::integration);
    }

    @Override
    public void save(Integration integration) {
        dslContext
                .insertInto(REPOSITORY_INTEGRATION)
                .set(REPOSITORY_INTEGRATION.INTEGRATION_ID, integration.id())
                .set(REPOSITORY_INTEGRATION.PROJECT_ID, integration.projectId())
                .set(REPOSITORY_INTEGRATION.PROVIDER, integration.provider().name())
                .set(REPOSITORY_INTEGRATION.BASE_URL, integration.baseUrl())
                .set(REPOSITORY_INTEGRATION.REPOSITORY, integration.repository())
                .set(REPOSITORY_INTEGRATION.EXTERNAL_REPOSITORY_ID, integration.externalRepositoryId())
                .set(REPOSITORY_INTEGRATION.WEB_URL, integration.webUrl())
                .set(REPOSITORY_INTEGRATION.TOKEN_CIPHER, integration.tokenCipher())
                .set(REPOSITORY_INTEGRATION.WEBHOOK_SECRET_CIPHER, integration.webhookSecretCipher())
                .set(REPOSITORY_INTEGRATION.WEBHOOK_ID, integration.webhookId())
                .set(REPOSITORY_INTEGRATION.ACCOUNT_LOGIN, integration.accountLogin())
                .set(REPOSITORY_INTEGRATION.LAST_EVENT_AT, integration.lastEventAt())
                .set(REPOSITORY_INTEGRATION.LAST_ERROR, integration.lastError())
                .set(REPOSITORY_INTEGRATION.VERSION, integration.version())
                .set(REPOSITORY_INTEGRATION.CREATED_AT, integration.updatedAt())
                .set(REPOSITORY_INTEGRATION.CREATED_BY, integration.updatedBy())
                .set(REPOSITORY_INTEGRATION.UPDATED_AT, integration.updatedAt())
                .set(REPOSITORY_INTEGRATION.UPDATED_BY, integration.updatedBy())
                .onConflict(REPOSITORY_INTEGRATION.INTEGRATION_ID)
                .doUpdate()
                .set(REPOSITORY_INTEGRATION.TOKEN_CIPHER, integration.tokenCipher())
                .set(REPOSITORY_INTEGRATION.WEBHOOK_ID, integration.webhookId())
                .set(REPOSITORY_INTEGRATION.ACCOUNT_LOGIN, integration.accountLogin())
                .set(REPOSITORY_INTEGRATION.LAST_EVENT_AT, integration.lastEventAt())
                .set(REPOSITORY_INTEGRATION.LAST_ERROR, integration.lastError())
                .set(REPOSITORY_INTEGRATION.VERSION, REPOSITORY_INTEGRATION.VERSION.plus(1))
                .set(REPOSITORY_INTEGRATION.UPDATED_AT, integration.updatedAt())
                .set(REPOSITORY_INTEGRATION.UPDATED_BY, integration.updatedBy())
                .execute();
    }

    @Override
    public void deleteById(UUID id) {
        dslContext
                .deleteFrom(REPOSITORY_INTEGRATION)
                .where(REPOSITORY_INTEGRATION.INTEGRATION_ID.eq(id))
                .execute();
    }

    @Override
    public Map<RuleEvent, Optional<UUID>> findRules(UUID projectId) {
        var rules = new EnumMap<RuleEvent, Optional<UUID>>(RuleEvent.class);
        dslContext
                .selectFrom(INTEGRATION_RULE)
                .where(INTEGRATION_RULE.PROJECT_ID.eq(projectId))
                .forEach(row -> rules.put(RuleEvent.valueOf(row.getEvent()), Optional.ofNullable(row.getColumnId())));
        return rules;
    }

    @Override
    public void saveRules(UUID projectId, Map<RuleEvent, Optional<UUID>> rules, UUID actor, Instant now) {
        dslContext
                .deleteFrom(INTEGRATION_RULE)
                .where(INTEGRATION_RULE.PROJECT_ID.eq(projectId))
                .execute();
        for (var rule : rules.entrySet())
            dslContext
                    .insertInto(INTEGRATION_RULE)
                    .set(INTEGRATION_RULE.PROJECT_ID, projectId)
                    .set(INTEGRATION_RULE.EVENT, rule.getKey().name())
                    .set(INTEGRATION_RULE.COLUMN_ID, rule.getValue().orElse(null))
                    .set(INTEGRATION_RULE.UPDATED_AT, now)
                    .set(INTEGRATION_RULE.UPDATED_BY, actor)
                    .execute();
    }

    private static Integration integration(RepositoryIntegrationRecord row) {
        return Integration.fromPersistence(
                row.getIntegrationId(),
                row.getProjectId(),
                Provider.valueOf(row.getProvider()),
                row.getBaseUrl(),
                row.getRepository(),
                row.getExternalRepositoryId(),
                row.getWebUrl(),
                row.getTokenCipher(),
                row.getWebhookSecretCipher(),
                row.getWebhookId(),
                row.getAccountLogin(),
                row.getLastEventAt(),
                row.getLastError(),
                row.getVersion(),
                row.getUpdatedAt(),
                row.getUpdatedBy());
    }
}

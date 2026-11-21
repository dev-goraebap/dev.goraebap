package xyz.goraebap.productivity.issue.application.code;

import java.time.Clock;
import java.util.EnumMap;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import xyz.goraebap.productivity.issue.application.IssueProjects;
import xyz.goraebap.productivity.issue.domain.board.IssueColumnRepository;
import xyz.goraebap.productivity.issue.domain.code.GitHostException;
import xyz.goraebap.productivity.issue.domain.code.Integration;
import xyz.goraebap.productivity.issue.domain.code.IntegrationRepository;
import xyz.goraebap.productivity.issue.domain.code.Provider;
import xyz.goraebap.productivity.issue.domain.code.Remote;
import xyz.goraebap.productivity.issue.domain.code.RuleEvent;
import xyz.goraebap.productivity.project.ProjectSummary;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * Connecting a project to repositories and the rules events move work items by (저장소 연동, BIT D-087), for Projects
 * administrators. With a token the host is asked first, outside any transaction, so a wrong token or name is refused
 * with the host's reason and leaves nothing behind, and the server registers the webhook itself where the token may;
 * without one (결정기록 2026-11-04) nothing is asked and the manager registers the webhook by hand with the address and
 * secret shown. A component rather than a service: its calls to the hosts stay outside the transactions it opens.
 */
@Component
class RepositoryConnections {
    private static final Logger LOG = LoggerFactory.getLogger(RepositoryConnections.class);
    private static final Pattern REPOSITORY = Pattern.compile("[A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+){1,8}");
    private final IntegrationRepository integrationRepository;
    private final IssueColumnRepository issueColumnRepository;
    private final IssueProjects issueProjects;
    private final CodeHosts codeHosts;
    private final CodeService codeService;
    private final TransactionTemplate transactions;
    private final Clock clock;

    RepositoryConnections(
            IntegrationRepository integrationRepository,
            IssueColumnRepository issueColumnRepository,
            IssueProjects issueProjects,
            CodeHosts codeHosts,
            CodeService codeService,
            PlatformTransactionManager transactionManager,
            Clock clock) {
        this.integrationRepository = integrationRepository;
        this.issueColumnRepository = issueColumnRepository;
        this.issueProjects = issueProjects;
        this.codeHosts = codeHosts;
        this.codeService = codeService;
        this.transactions = new TransactionTemplate(transactionManager);
        this.clock = clock;
    }

    CodeViews.Integration connect(CurrentUser user, String key, CodeRequests.Connect request) {
        var project = read(() -> issueProjects.administered(user, key));
        var provider = Provider.valueOf(request.provider());
        String base = baseUrl(provider, request.baseUrl());
        String repository = repository(base, request.repository());
        String token = request.token() == null || request.token().isBlank()
                ? null
                : request.token().strip();
        var host = codeHosts.of(provider);
        Remote.Repository found;
        if (token == null) found = new Remote.Repository(repository, null, base + "/" + repository, null);
        else
            try {
                found = host.verify(new Remote.Connection(base, repository, null, token));
            } catch (GitHostException refused) {
                throw CodeErrorCode.INTEGRATION_HOST_REFUSED.raise(refused.getMessage());
            }
        String secret = codeHosts.cipher().newSecret();
        var integration = Integration.create(
                UUID.randomUUID(),
                project.id(),
                provider,
                base,
                found.fullName() == null ? repository : found.fullName(),
                found.externalId(),
                found.webUrl() == null ? base + "/" + repository : found.webUrl(),
                token == null ? null : codeHosts.cipher().seal(token),
                codeHosts.cipher().seal(secret),
                found.accountLogin(),
                user.id(),
                clock.instant());
        write(() -> {
            if (integrationRepository.findAllByProjectId(project.id()).stream()
                    .anyMatch(each -> each.provider() == provider
                            && each.baseUrl().equals(base)
                            && (each.repository().equalsIgnoreCase(integration.repository())
                                    || (integration.externalRepositoryId() != null
                                            && integration
                                                    .externalRepositoryId()
                                                    .equals(each.externalRepositoryId())))))
                throw CodeErrorCode.INTEGRATION_EXISTS.raise();
            integrationRepository.save(integration);
            issueProjects.signal(project);
        });
        // Registering the webhook may need more than the token can (the repository's administrator); then by hand.
        if (token != null)
            try {
                host.createWebhook(codeHosts.connection(integration), codeHosts.hookUrl(integration.id()), secret)
                        .ifPresent(id -> {
                            integration.registeredWebhook(id);
                            write(() -> integrationRepository.save(integration));
                        });
            } catch (GitHostException refused) {
                LOG.info("Webhook not registered for integration {}: {}", integration.id(), refused.getMessage());
            }
        return read(() -> codeService.view(find(project, integration.id()), true));
    }

    /** A new token: checked with the host first, then kept sealed in place of the old one. */
    CodeViews.Integration revise(CurrentUser user, String key, UUID integrationId, CodeRequests.Revise request) {
        var project = read(() -> issueProjects.administered(user, key));
        var integration = find(project, integrationId);
        if (integration.version() != request.expectedVersion())
            throw CodeErrorCode.INTEGRATION_VERSION_CONFLICT.raise();
        var connection = new Remote.Connection(
                integration.baseUrl(),
                integration.repository(),
                integration.externalRepositoryId(),
                request.token().strip());
        Remote.Repository found;
        try {
            found = codeHosts.of(integration.provider()).verify(connection);
        } catch (GitHostException refused) {
            throw CodeErrorCode.INTEGRATION_HOST_REFUSED.raise(refused.getMessage());
        }
        integration.replaceToken(
                codeHosts.cipher().seal(connection.token()), found.accountLogin(), user.id(), clock.instant());
        write(() -> integrationRepository.save(integration));
        return read(() -> codeService.view(find(project, integrationId), true));
    }

    /** Removes the connection and its links, and the webhook on the host when the server registered it. */
    void disconnect(CurrentUser user, String key, UUID integrationId) {
        var project = read(() -> issueProjects.administered(user, key));
        var integration = find(project, integrationId);
        if (integration.webhookId() != null && integration.hasToken())
            try {
                codeHosts
                        .of(integration.provider())
                        .deleteWebhook(codeHosts.connection(integration), integration.webhookId());
            } catch (GitHostException | IllegalStateException unreachable) {
                LOG.info("Webhook of integration {} left on the host: {}", integration.id(), unreachable.getMessage());
            }
        write(() -> {
            integrationRepository.deleteById(integration.id());
            issueProjects.signal(project);
        });
    }

    CodeViews.Rules setRules(CurrentUser user, String key, CodeRequests.Rules request) {
        var project = read(() -> issueProjects.administered(user, key));
        write(() -> {
            var columns = issueColumnRepository.findAllByProjectId(project.id());
            var next = new EnumMap<RuleEvent, Optional<UUID>>(RuleEvent.class);
            next.putAll(integrationRepository.findRules(project.id()));
            for (var rule : request.items()) {
                var event = RuleEvent.valueOf(rule.event());
                if (!rule.set()) {
                    next.remove(event);
                    continue;
                }
                if (rule.columnId() != null
                        && columns.stream().noneMatch(column -> column.id().equals(rule.columnId())))
                    throw CodeErrorCode.INTEGRATION_INVALID.raise("보드에 없는 상태입니다");
                next.put(event, Optional.ofNullable(rule.columnId()));
            }
            integrationRepository.saveRules(project.id(), next, user.id(), clock.instant());
        });
        return read(() -> codeService.rules(user, key));
    }

    private Integration find(ProjectSummary project, UUID integrationId) {
        return read(() -> integrationRepository.findById(integrationId))
                .filter(found -> found.projectId().equals(project.id()))
                .orElseThrow(CodeErrorCode.INTEGRATION_NOT_FOUND::raise);
    }

    /** The host's address, without a trailing slash; GitHub and GitLab default to their own. */
    private static String baseUrl(Provider provider, String given) {
        String base = given == null || given.isBlank() ? provider.defaultUrl() : given.strip();
        if (base == null) throw CodeErrorCode.INTEGRATION_INVALID.raise("Gitea는 주소가 필요합니다");
        base = base.replaceAll("/+$", "");
        if (!base.matches("https?://[^\\s/]+(/[^\\s]*)?"))
            throw CodeErrorCode.INTEGRATION_INVALID.raise("호스트 주소가 올바르지 않습니다");
        return base;
    }

    /** group/project or owner/repository, also from its address pasted whole. */
    private static String repository(String base, String given) {
        String name = given.strip();
        if (name.startsWith(base + "/")) name = name.substring(base.length() + 1);
        name = name.replaceFirst("^https?://[^/]+/", "").replaceAll("/+$", "").replaceAll("\\.git$", "");
        if (!REPOSITORY.matcher(name).matches())
            throw CodeErrorCode.INTEGRATION_INVALID.raise("저장소는 group/project 또는 owner/repository로 적어 주세요");
        return name;
    }

    private <T> T read(Supplier<T> work) {
        return transactions.execute(status -> work.get());
    }

    private void write(Runnable work) {
        transactions.executeWithoutResult(status -> work.run());
    }
}

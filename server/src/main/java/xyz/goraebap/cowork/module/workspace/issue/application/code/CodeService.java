package xyz.goraebap.cowork.module.workspace.issue.application.code;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.cowork.module.workspace.issue.application.IssueErrorCode;
import xyz.goraebap.cowork.module.workspace.issue.application.IssueProjects;
import xyz.goraebap.cowork.module.workspace.issue.domain.board.IssueColumnRepository;
import xyz.goraebap.cowork.module.workspace.issue.domain.code.CodeLinkRepository;
import xyz.goraebap.cowork.module.workspace.issue.domain.code.Integration;
import xyz.goraebap.cowork.module.workspace.issue.domain.code.IntegrationRepository;
import xyz.goraebap.cowork.module.workspace.issue.domain.code.RuleEvent;
import xyz.goraebap.cowork.module.workspace.issue.domain.issue.IssueRepository;
import xyz.goraebap.cowork.module.workspace.project.ProjectRole;
import xyz.goraebap.cowork.shared.web.CurrentUser;

/**
 * What a project's repository connection reads (저장소 연동, BIT D-087): its connections (the webhook secret only for
 * Workspace administrators), the rules by which events move work items, and a work item's links into the repositories.
 * Every member reads them; changing them is RepositoryConnections'.
 */
@Service
@RequiredArgsConstructor
public class CodeService {
    private final IntegrationRepository integrationRepository;
    private final CodeLinkRepository codeLinkRepository;
    private final IssueColumnRepository issueColumnRepository;
    private final IssueRepository issueRepository;
    private final IssueProjects issueProjects;
    private final CodeHosts codeHosts;

    @Transactional(readOnly = true)
    public List<CodeViews.Integration> list(CurrentUser user, String key) {
        var project = issueProjects.readable(user, key);
        return integrationRepository.findAllByProjectId(project.id()).stream()
                .map(each -> view(each, issueProjects.roleOf(user, project).atLeast(ProjectRole.ADMIN)))
                .toList();
    }

    @Transactional(readOnly = true)
    public CodeViews.Rules rules(CurrentUser user, String key) {
        var project = issueProjects.readable(user, key);
        var columns = issueColumnRepository.findAllByProjectId(project.id());
        var set = integrationRepository.findRules(project.id());
        var items = new ArrayList<CodeViews.Rule>();
        for (RuleEvent event : RuleEvent.values()) {
            var rule = set.get(event);
            items.add(new CodeViews.Rule(
                    event.name(),
                    rule != null,
                    rule == null ? null : rule.orElse(null),
                    CodeHosts.defaultColumn(event, columns)));
        }
        return new CodeViews.Rules(items);
    }

    /** A work item's links into the project's repositories, the latest moved last. */
    @Transactional(readOnly = true)
    public List<CodeViews.Link> links(CurrentUser user, String key, long number) {
        var project = issueProjects.readable(user, key);
        var issue = issueRepository
                .findByProjectIdAndNumber(project.id(), number)
                .filter(found -> !found.isDeleted())
                .orElseThrow(IssueErrorCode.ISSUE_NOT_FOUND::raise);
        var connections = new HashMap<UUID, Integration>();
        integrationRepository.findAllByProjectId(project.id()).forEach(each -> connections.put(each.id(), each));
        return codeLinkRepository.findAllByIssueId(issue.id()).stream()
                .filter(link -> connections.containsKey(link.integrationId()))
                .map(link -> new CodeViews.Link(
                        link.id(),
                        link.integrationId(),
                        connections.get(link.integrationId()).provider().name(),
                        connections.get(link.integrationId()).baseUrl(),
                        connections.get(link.integrationId()).repository(),
                        link.kind().name(),
                        link.externalId(),
                        link.url(),
                        link.title(),
                        link.state().name(),
                        link.author(),
                        link.detail(),
                        link.updatedAt()))
                .toList();
    }

    CodeViews.Integration view(Integration integration, boolean administrator) {
        return new CodeViews.Integration(
                integration.id(),
                integration.provider().name(),
                integration.baseUrl(),
                integration.repository(),
                integration.webUrl(),
                integration.hasToken(),
                integration.accountLogin(),
                codeHosts.hookUrl(integration.id()),
                administrator ? codeHosts.secret(integration) : "",
                integration.webhookId() != null,
                integration.lastEventAt(),
                integration.lastError(),
                integration.version());
    }
}

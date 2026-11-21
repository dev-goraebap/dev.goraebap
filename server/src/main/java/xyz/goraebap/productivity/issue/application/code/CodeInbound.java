package xyz.goraebap.productivity.issue.application.code;

import java.time.Clock;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import xyz.goraebap.productivity.issue.application.IssueProjects;
import xyz.goraebap.productivity.issue.application.issue.IssueService;
import xyz.goraebap.productivity.issue.domain.board.ColumnCategory;
import xyz.goraebap.productivity.issue.domain.board.IssueColumn;
import xyz.goraebap.productivity.issue.domain.board.IssueColumnRepository;
import xyz.goraebap.productivity.issue.domain.code.CodeLink;
import xyz.goraebap.productivity.issue.domain.code.CodeLinkRepository;
import xyz.goraebap.productivity.issue.domain.code.Integration;
import xyz.goraebap.productivity.issue.domain.code.IntegrationRepository;
import xyz.goraebap.productivity.issue.domain.code.References;
import xyz.goraebap.productivity.issue.domain.code.Remote;
import xyz.goraebap.productivity.issue.domain.code.RuleEvent;
import xyz.goraebap.productivity.issue.domain.issue.IssueRepository;
import xyz.goraebap.productivity.project.ProjectFacade;
import xyz.goraebap.productivity.project.ProjectSummary;
import xyz.goraebap.shared.error.BusinessException;

/**
 * What a repository tells the server (저장소 연동, BIT D-087), its signed webhooks: a pushed branch naming a work item
 * (P2-6) is linked to it and starts it by the project's rules, a commit naming one is linked, and a pull or merge request
 * naming one is linked in its state and moves it to review or done. A reference only counts in the connected project
 * (its current key or an old one). What cannot be applied is noted on the connection, not refused to the host.
 */
@Component
public class CodeInbound {
    private static final Logger LOG = LoggerFactory.getLogger(CodeInbound.class);
    private final IntegrationRepository integrationRepository;
    private final CodeLinkRepository codeLinkRepository;
    private final IssueRepository issueRepository;
    private final IssueColumnRepository issueColumnRepository;
    private final IssueService issueService;
    private final IssueProjects issueProjects;
    private final ProjectFacade projectFacade;
    private final CodeHosts codeHosts;
    private final TransactionTemplate transactions;
    private final Clock clock;

    CodeInbound(
            IntegrationRepository integrationRepository,
            CodeLinkRepository codeLinkRepository,
            IssueRepository issueRepository,
            IssueColumnRepository issueColumnRepository,
            IssueService issueService,
            IssueProjects issueProjects,
            ProjectFacade projectFacade,
            CodeHosts codeHosts,
            PlatformTransactionManager transactionManager,
            Clock clock) {
        this.integrationRepository = integrationRepository;
        this.codeLinkRepository = codeLinkRepository;
        this.issueRepository = issueRepository;
        this.issueColumnRepository = issueColumnRepository;
        this.issueService = issueService;
        this.issueProjects = issueProjects;
        this.projectFacade = projectFacade;
        this.codeHosts = codeHosts;
        this.transactions = new TransactionTemplate(transactionManager);
        this.clock = clock;
    }

    /** A delivery to /api/v1/hooks/{id}; refused, all alike, unless signed with that connection's secret. */
    public void receive(UUID integrationId, Map<String, String> headers, byte[] body) {
        var integration = transactions
                .execute(status -> integrationRepository.findById(integrationId))
                .orElseThrow(CodeErrorCode.HOOK_REJECTED::raise);
        var host = codeHosts.of(integration.provider());
        if (!host.signed(headers, body, codeHosts.secret(integration))) throw CodeErrorCode.HOOK_REJECTED.raise();
        List<Remote.Event> events;
        try {
            events = host.read(headers, body);
        } catch (RuntimeException unreadable) {
            LOG.info("Unreadable delivery for integration {}: {}", integrationId, unreadable.getMessage());
            events = List.of();
        }
        String failure = null;
        for (var event : events)
            try {
                transactions.executeWithoutResult(status -> apply(integration, event));
            } catch (BusinessException refused) {
                failure = refused.getMessage();
                LOG.info("Delivery for integration {} not applied: {}", integrationId, failure);
            }
        integration.heard(clock.instant(), failure);
        transactions.executeWithoutResult(status -> integrationRepository.save(integration));
    }

    private void apply(Integration integration, Remote.Event event) {
        var project =
                projectFacade.summariesOf(List.of(integration.projectId())).get(integration.projectId());
        if (project == null || project.deleted() || project.archived()) return;
        var scene = new Scene(
                integration,
                project,
                issueColumnRepository.findAllByProjectId(project.id()),
                integrationRepository.findRules(project.id()));
        boolean changed =
                switch (event) {
                    case Remote.Push push -> pushed(scene, push);
                    case Remote.PullEvent pull -> pulled(scene, pull);
                };
        if (changed) issueProjects.signal(project);
    }

    private boolean pushed(Scene scene, Remote.Push push) {
        var now = clock.instant();
        var branchItems = resolve(scene, References.refs(push.branch()));
        String last = push.commits().isEmpty() ? null : push.commits().getLast().sha();
        var links = new ArrayList<CodeLink>();
        for (UUID issueId : branchItems) {
            var existing =
                    codeLinkRepository.find(scene.integration.id(), CodeLink.Kind.branch, push.branch(), issueId);
            links.add(existing.map(
                            link -> link.seen(push.branch(), CodeLink.State.open, push.sender(), shortSha(last), now))
                    .orElseGet(() -> CodeLink.of(
                            scene.integration.id(),
                            issueId,
                            CodeLink.Kind.branch,
                            push.branch(),
                            push.branchUrl() == null ? scene.integration.webUrl() : push.branchUrl(),
                            push.branch(),
                            CodeLink.State.open,
                            push.sender(),
                            shortSha(last),
                            now)));
            if (existing.isEmpty()) move(scene, issueId, RuleEvent.branch_push);
        }
        for (var commit : push.commits()) {
            var items = new LinkedHashSet<>(branchItems);
            items.addAll(resolve(scene, References.refs(commit.message())));
            String title = commit.message() == null
                    ? commit.sha()
                    : commit.message().lines().findFirst().orElse(commit.sha());
            for (UUID issueId : items) {
                if (codeLinkRepository
                        .find(scene.integration.id(), CodeLink.Kind.commit, commit.sha(), issueId)
                        .isPresent()) continue;
                links.add(CodeLink.of(
                        scene.integration.id(),
                        issueId,
                        CodeLink.Kind.commit,
                        commit.sha(),
                        commit.url() == null ? scene.integration.webUrl() : commit.url(),
                        title,
                        CodeLink.State.open,
                        commit.author(),
                        push.branch(),
                        now));
            }
        }
        codeLinkRepository.saveAll(links);
        return !links.isEmpty();
    }

    private boolean pulled(Scene scene, Remote.PullEvent pull) {
        var now = clock.instant();
        var items = new LinkedHashSet<UUID>();
        items.addAll(resolve(scene, References.refs(pull.branch())));
        items.addAll(resolve(scene, References.refs(pull.title())));
        items.addAll(resolve(scene, References.refs(pull.body())));
        if (items.isEmpty()) return false;
        var state =
                switch (pull.action()) {
                    case "merged" -> CodeLink.State.merged;
                    case "closed" -> CodeLink.State.closed;
                    default -> pull.draft() ? CodeLink.State.draft : CodeLink.State.open;
                };
        var links = new ArrayList<CodeLink>();
        for (UUID issueId : items) {
            var existing =
                    codeLinkRepository.find(scene.integration.id(), CodeLink.Kind.pull_request, pull.number(), issueId);
            links.add(existing.map(link -> link.seen(pull.title(), state, pull.sender(), pull.branch(), now))
                    .orElseGet(() -> CodeLink.of(
                            scene.integration.id(),
                            issueId,
                            CodeLink.Kind.pull_request,
                            pull.number(),
                            pull.url() == null ? scene.integration.webUrl() : pull.url(),
                            pull.title(),
                            state,
                            pull.sender(),
                            pull.branch(),
                            now)));
            if (state == CodeLink.State.merged) move(scene, issueId, RuleEvent.pr_merged);
            else if (state != CodeLink.State.closed
                    && ("opened".equals(pull.action()) || "ready".equals(pull.action())))
                move(scene, issueId, RuleEvent.pr_opened);
        }
        codeLinkRepository.saveAll(links);
        return true;
    }

    /**
     * Moves the work item by the event's rule, forward only (BIT's): a branch starts what is not started yet, an opened
     * request moves what is not closed further along, a merge closes what is not closed.
     */
    private void move(Scene scene, UUID issueId, RuleEvent event) {
        var target = CodeHosts.column(event, scene.rules, scene.columns);
        if (target.isEmpty()) return;
        var issue = issueRepository.findById(issueId).filter(found -> !found.isDeleted());
        if (issue.isEmpty() || issue.get().columnId().equals(target.get())) return;
        var category = categoryOf(scene, issue.get().columnId());
        boolean ahead =
                indexOf(scene, target.get()) > indexOf(scene, issue.get().columnId());
        boolean moves =
                switch (event) {
                    case branch_push ->
                        category == null || category == ColumnCategory.BACKLOG || category == ColumnCategory.UNSTARTED;
                    case pr_opened -> (category == null || !category.closes()) && ahead;
                    case pr_merged -> category == null || !category.closes();
                };
        if (moves) issueService.moveByRule(issueId, target.get());
    }

    /** The live work items of the connected project the references name. */
    private Set<UUID> resolve(Scene scene, Set<String> refs) {
        var found = new LinkedHashSet<UUID>();
        for (String ref : refs) {
            int dash = ref.lastIndexOf('-');
            String key = ref.substring(0, dash);
            long number = Long.parseLong(ref.substring(dash + 1));
            Optional<ProjectSummary> named =
                    key.equals(scene.project.key()) ? Optional.of(scene.project) : projectFacade.findByKey(key);
            if (named.isEmpty() || !named.get().id().equals(scene.project.id())) continue;
            issueRepository
                    .findByProjectIdAndNumber(scene.project.id(), number)
                    .filter(issue -> !issue.isDeleted())
                    .ifPresent(issue -> found.add(issue.id()));
        }
        return found;
    }

    private static ColumnCategory categoryOf(Scene scene, UUID columnId) {
        return scene.columns.stream()
                .filter(column -> column.id().equals(columnId))
                .map(IssueColumn::category)
                .findFirst()
                .orElse(null);
    }

    private static int indexOf(Scene scene, UUID columnId) {
        for (int i = 0; i < scene.columns.size(); i++)
            if (scene.columns.get(i).id().equals(columnId)) return i;
        return -1;
    }

    private static String shortSha(String sha) {
        return sha == null ? null : sha.substring(0, Math.min(7, sha.length()));
    }

    private record Scene(
            Integration integration,
            ProjectSummary project,
            List<IssueColumn> columns,
            Map<RuleEvent, Optional<UUID>> rules) {}
}

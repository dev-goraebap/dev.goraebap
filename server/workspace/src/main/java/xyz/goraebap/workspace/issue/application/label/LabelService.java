package xyz.goraebap.workspace.issue.application.label;

import xyz.goraebap.workspace.project.WorkspaceRoles;
import java.time.Clock;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.foundation.realtime.RealtimeFacade;
import xyz.goraebap.foundation.realtime.Signal;
import xyz.goraebap.workspace.issue.application.IssueErrorCode;
import xyz.goraebap.workspace.issue.domain.label.IssueLabel;
import xyz.goraebap.workspace.issue.domain.label.IssueLabelRepository;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/**
 * The workspace's labels, shared by every project (BIT D-009; 결정기록 2026-11-04 프로젝트 관리): every member reads
 * them and puts them on issues; Workspace administrators make, rename, recolour, order and delete them. Deleting one takes
 * it off every issue.
 */
@Service
@RequiredArgsConstructor
public class LabelService {
    private final IssueLabelRepository issueLabelRepository;
    /** What a change of the workspace's own (not one project's) is signalled under: every project's screens read again. */
    private static final UUID WORKSPACE = new UUID(0, 0);

    private final RealtimeFacade realtimeFacade;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<LabelViews.LabelView> labels() {
        return issueLabelRepository.findAll().stream()
                .map(label -> new LabelViews.LabelView(
                        label.id(),
                        label.name(),
                        label.color(),
                        label.position(),
                        issueLabelRepository.countUses(label.id())))
                .toList();
    }

    @Transactional
    public UUID create(CurrentUser user, LabelRequests.LabelInput request) {
        requireAdmin(user);
        return make(user.id(), clock.instant(), request);
    }

    /**
     * A label an importer brings with the issues, made by actor at the given moment; one of the
     * same name already there is the one it means.
     */
    @Transactional
    public UUID create(UUID actor, Instant at, LabelRequests.LabelInput request) {
        return issueLabelRepository.findAll().stream()
                .filter(label -> label.name().equalsIgnoreCase(request.name().strip()))
                .map(IssueLabel::id)
                .findFirst()
                .orElseGet(() -> make(actor, at, request));
    }

    @Transactional
    public void edit(CurrentUser user, UUID labelId, LabelRequests.LabelInput request) {
        requireAdmin(user);
        var label = labelOf(labelId);
        label.revise(request.name(), request.color());
        requireFreeName(label);
        issueLabelRepository.save(label, user.id(), clock.instant());
        signal();
    }

    /** Puts the labels in the order given; every label must be named once. */
    @Transactional
    public void reorder(CurrentUser user, LabelRequests.Order request) {
        requireAdmin(user);
        var known = issueLabelRepository.findAll().stream().map(IssueLabel::id).toList();
        if (request.ids().size() != known.size() || !new HashSet<>(request.ids()).equals(new HashSet<>(known)))
            throw IssueErrorCode.ISSUE_LABEL_NOT_FOUND.raise();
        issueLabelRepository.reorder(request.ids(), user.id(), clock.instant());
        signal();
    }

    @Transactional
    public void delete(CurrentUser user, UUID labelId) {
        requireAdmin(user);
        issueLabelRepository.deleteById(labelOf(labelId).id());
        signal();
    }

    private UUID make(UUID actor, Instant at, LabelRequests.LabelInput request) {
        var label = IssueLabel.create(
                UUID.randomUUID(), request.name(), request.color(), issueLabelRepository.nextPosition());
        requireFreeName(label);
        issueLabelRepository.save(label, actor, at);
        signal();
        return label.id();
    }

    private IssueLabel labelOf(UUID labelId) {
        return issueLabelRepository.findById(labelId).orElseThrow(IssueErrorCode.ISSUE_LABEL_NOT_FOUND::raise);
    }

    private void requireFreeName(IssueLabel label) {
        if (issueLabelRepository.existsByNameAndIdNot(label.name(), label.id()))
            throw IssueErrorCode.ISSUE_LABEL_NAME_CONFLICT.raise();
    }

    private static void requireAdmin(CurrentUser user) {
        if (!WorkspaceRoles.admin(user)) throw new AccessDeniedException("워크스페이스 관리자만 할 수 있습니다");
    }

    /** Every screen hears that the work items' labels changed. */
    private void signal() {
        realtimeFacade.signal(Signal.toEveryone(Signal.Topic.ISSUES, WORKSPACE));
    }
}

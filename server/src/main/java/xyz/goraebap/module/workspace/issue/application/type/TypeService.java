package xyz.goraebap.module.workspace.issue.application.type;

import xyz.goraebap.module.workspace.project.WorkspaceRoles;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.module.foundation.realtime.RealtimeFacade;
import xyz.goraebap.module.foundation.realtime.Signal;
import xyz.goraebap.module.workspace.issue.application.IssueErrorCode;
import xyz.goraebap.module.workspace.issue.domain.type.WorkItemType;
import xyz.goraebap.module.workspace.issue.domain.type.WorkItemTypeRepository;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * The workspace's work item types (BIT D-104; 결정기록 2026-11-04 프로젝트 관리): every member reads them and gives
 * them to work items; Workspace administrators make, rename, re-mark, order them and choose the default. The default type
 * and a type a work item keeps (a deleted one too, for its history) are not deleted.
 */
@Service
@RequiredArgsConstructor
public class TypeService {
    private static final String CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final WorkItemTypeRepository workItemTypeRepository;
    /** What a change of the workspace's own (not one project's) is signalled under: every project's screens read again. */
    private static final UUID WORKSPACE = new UUID(0, 0);

    private final RealtimeFacade realtimeFacade;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<TypeViews.TypeView> types() {
        return workItemTypeRepository.findAll().stream()
                .map(type -> new TypeViews.TypeView(
                        type.code(),
                        type.name(),
                        type.icon(),
                        type.color(),
                        type.position(),
                        type.isDefault(),
                        workItemTypeRepository.countUses(type.code())))
                .toList();
    }

    /**
     * The code a work item is given: the one named (its code, or its name whatever the case, as an agent may say it),
     * the default when none is; ISSUE_TYPE_NOT_FOUND when no type is so named.
     */
    @Transactional(readOnly = true)
    public String codeOf(String named) {
        var types = workItemTypeRepository.findAll();
        if (named == null || named.isBlank())
            return types.stream()
                    .filter(WorkItemType::isDefault)
                    .map(WorkItemType::code)
                    .findFirst()
                    .orElse(types.getFirst().code());
        String wanted = named.strip();
        return types.stream()
                .filter(type ->
                        type.code().equalsIgnoreCase(wanted) || type.name().equalsIgnoreCase(wanted))
                .map(WorkItemType::code)
                .findFirst()
                .orElseThrow(IssueErrorCode.ISSUE_TYPE_NOT_FOUND::raise);
    }

    /** The type's name, for the timeline; its code when it is gone. */
    @Transactional(readOnly = true)
    public String nameOf(String code) {
        return workItemTypeRepository.findByCode(code).map(WorkItemType::name).orElse(code);
    }

    @Transactional
    public String create(CurrentUser user, TypeRequests.TypeInput request) {
        requireAdmin(user);
        var type = WorkItemType.create(
                freeCode(), request.name(), request.icon(), request.color(), workItemTypeRepository.nextPosition());
        requireFreeName(type);
        workItemTypeRepository.save(type, user.id(), clock.instant());
        if (request.isDefault()) workItemTypeRepository.makeDefault(type.code(), user.id(), clock.instant());
        signal();
        return type.code();
    }

    @Transactional
    public void edit(CurrentUser user, String code, TypeRequests.TypeInput request) {
        requireAdmin(user);
        var type = typeOf(code);
        type.revise(request.name(), request.icon(), request.color());
        requireFreeName(type);
        workItemTypeRepository.save(type, user.id(), clock.instant());
        if (request.isDefault() && !type.isDefault())
            workItemTypeRepository.makeDefault(type.code(), user.id(), clock.instant());
        signal();
    }

    /** Puts the types in the order given; every type must be named once. */
    @Transactional
    public void reorder(CurrentUser user, TypeRequests.Order request) {
        requireAdmin(user);
        var known = workItemTypeRepository.findAll().stream()
                .map(WorkItemType::code)
                .toList();
        if (request.codes().size() != known.size() || !new HashSet<>(request.codes()).equals(new HashSet<>(known)))
            throw IssueErrorCode.ISSUE_TYPE_NOT_FOUND.raise();
        workItemTypeRepository.reorder(request.codes(), user.id(), clock.instant());
        signal();
    }

    @Transactional
    public void delete(CurrentUser user, String code) {
        requireAdmin(user);
        var type = typeOf(code);
        if (type.isDefault()) throw IssueErrorCode.ISSUE_TYPE_IN_USE.raise("기본 유형은 지울 수 없습니다");
        if (workItemTypeRepository.countUses(code) > 0) throw IssueErrorCode.ISSUE_TYPE_IN_USE.raise();
        workItemTypeRepository.delete(code);
        signal();
    }

    private WorkItemType typeOf(String code) {
        return workItemTypeRepository.findByCode(code).orElseThrow(IssueErrorCode.ISSUE_TYPE_NOT_FOUND::raise);
    }

    private void requireFreeName(WorkItemType type) {
        if (workItemTypeRepository.existsByNameAndCodeNot(type.name(), type.code()))
            throw IssueErrorCode.ISSUE_TYPE_NAME_CONFLICT.raise();
    }

    /** A new type's code: T and seven letters no type has. */
    private String freeCode() {
        while (true) {
            var code = new StringBuilder("T");
            for (int index = 0; index < 7; index++)
                code.append(CODE_LETTERS.charAt(RANDOM.nextInt(CODE_LETTERS.length())));
            String candidate = code.toString().toUpperCase(Locale.ROOT);
            if (workItemTypeRepository.findByCode(candidate).isEmpty()) return candidate;
        }
    }

    private static void requireAdmin(CurrentUser user) {
        if (!WorkspaceRoles.admin(user)) throw new AccessDeniedException("워크스페이스 관리자만 할 수 있습니다");
    }

    private void signal() {
        realtimeFacade.signal(Signal.toEveryone(Signal.Topic.ISSUES, WORKSPACE));
    }
}

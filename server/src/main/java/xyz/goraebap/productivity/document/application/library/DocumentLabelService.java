package xyz.goraebap.productivity.document.application.library;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.productivity.document.application.DocumentErrorCode;
import xyz.goraebap.productivity.document.application.DocumentSpaces;
import xyz.goraebap.productivity.document.domain.library.LibraryRepository;
import xyz.goraebap.shared.error.DomainRuleViolation;
import xyz.goraebap.shared.web.CurrentUser;

@Service
@RequiredArgsConstructor
public class DocumentLabelService {
    private final LibraryRepository repository;
    private final DocumentSpaces spaces;

    @Transactional(readOnly = true)
    public List<DocumentLabelModels.LabelView> list() {
        return repository.labels().stream()
                .map(l -> new DocumentLabelModels.LabelView(
                        l.id(), l.name(), l.color(), l.position(), l.version(), l.uses()))
                .toList();
    }

    @Transactional
    public UUID create(CurrentUser user, DocumentLabelModels.Input input) {
        manage(user);
        unique(null, input.name());
        var id = UUID.randomUUID();
        repository.saveLabel(id, input.name().strip(), input.color(), null);
        spaces.signal(id);
        return id;
    }

    @Transactional
    public void edit(CurrentUser user, UUID id, DocumentLabelModels.Edit input) {
        manage(user);
        unique(id, input.name());
        if (!repository.saveLabel(id, input.name().strip(), input.color(), input.expectedVersion()))
            throw DocumentErrorCode.DOCUMENT_VERSION_CONFLICT.raise();
        spaces.signal(id);
    }

    @Transactional
    public void delete(CurrentUser user, UUID id, long version) {
        manage(user);
        if (!repository.deleteLabel(id, version)) throw DocumentErrorCode.DOCUMENT_VERSION_CONFLICT.raise();
        spaces.signal(id);
    }

    @Transactional
    public void order(CurrentUser user, DocumentLabelModels.Order input) {
        manage(user);
        var ids = repository.labels().stream().map(l -> l.id()).collect(java.util.stream.Collectors.toSet());
        if (ids.size() != input.ids().size() || !ids.equals(new HashSet<>(input.ids())))
            throw new DomainRuleViolation("전체 문서 라벨의 순서를 보내 주세요");
        repository.orderLabels(input.ids());
        spaces.signal(user.id());
    }

    private void unique(UUID id, String name) {
        if (repository.labels().stream()
                .anyMatch(l -> !l.id().equals(id) && l.name().equalsIgnoreCase(name.strip())))
            throw DocumentErrorCode.DOCUMENT_LABEL_NAME_CONFLICT.raise();
    }

    private static void manage(CurrentUser user) {
        if (!user.workspaceAdmin()) throw new AccessDeniedException("프로젝트 관리 권한이 필요합니다");
    }
}

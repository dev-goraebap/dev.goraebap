package xyz.goraebap.cowork.module.workspace.document.application.library;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.cowork.module.workspace.document.application.DocumentErrorCode;
import xyz.goraebap.cowork.module.workspace.document.application.DocumentSpaces;
import xyz.goraebap.cowork.module.workspace.document.application.document.DocumentRequests;
import xyz.goraebap.cowork.module.workspace.document.application.document.DocumentService;
import xyz.goraebap.cowork.module.workspace.document.application.document.DocumentViews.DocumentRow;
import xyz.goraebap.cowork.module.workspace.document.application.library.LibraryModels.Labels;
import xyz.goraebap.cowork.module.workspace.document.application.library.LibraryModels.Library;
import xyz.goraebap.cowork.module.workspace.document.application.library.LibraryModels.SaveOrder;
import xyz.goraebap.cowork.module.workspace.document.application.library.LibraryModels.SaveView;
import xyz.goraebap.cowork.module.workspace.document.domain.library.LibraryRepository;
import xyz.goraebap.cowork.module.workspace.document.domain.library.LibraryState.Label;
import xyz.goraebap.cowork.module.workspace.document.domain.library.LibraryState.Order;
import xyz.goraebap.cowork.module.workspace.document.domain.library.LibraryState.View;
import xyz.goraebap.cowork.shared.error.DomainRuleViolation;
import xyz.goraebap.cowork.shared.web.CurrentUser;

@Service
@RequiredArgsConstructor
public class LibraryService {
    private final LibraryRepository repository;
    private final DocumentSpaces spaces;
    private final DocumentService documents;
    private final xyz.goraebap.cowork.module.workspace.document.application.access.DocumentAccess access;
    private final xyz.goraebap.cowork.module.workspace.document.domain.document.DocumentRepository documentRepository;
    private final java.time.Clock clock;

    private UUID project(CurrentUser user, String key, boolean write) {
        return (write ? spaces.writable(user, key) : spaces.readable(user, key)).projectId();
    }

    /** The project a key names, for its administrators to keep its library: page moves, order and shared views. */
    private UUID managed(CurrentUser user, String key) {
        return spaces.administered(user, key).projectId();
    }

    private List<DocumentRow> rows(CurrentUser user, String key) {
        var rows = new java.util.ArrayList<DocumentRow>();
        String cursor = null;
        do {
            var page = documents.list(
                    user,
                    new DocumentRequests.Listing(
                            key, false, null, false, null, DocumentRequests.Sort.TITLE, null, cursor, 100));
            rows.addAll(page.items());
            cursor = page.nextCursor();
        } while (cursor != null);
        return List.copyOf(rows);
    }

    @Transactional(readOnly = true)
    public Library get(CurrentUser user, String key) {
        var project = project(user, key, false);
        var pages = rows(user, key);
        var visible = pages.stream().map(DocumentRow::id).collect(java.util.stream.Collectors.toSet());
        var assignments = new java.util.HashMap<>(repository.assignments(project));
        assignments.keySet().retainAll(visible);
        return new Library(
                repository.labels(),
                java.util.Map.copyOf(assignments),
                repository.views(project),
                pages,
                new Order(
                        repository.order(project).ids().stream()
                                .filter(visible::contains)
                                .toList(),
                        repository.order(project).version()),
                spaces.administers(user, project));
    }

    @Transactional
    public void assign(CurrentUser user, String key, UUID id, Labels value) {
        var project = project(user, key, true);
        var doc = documentRepository
                .findById(id)
                .filter(found -> !found.isDeleted())
                .orElseThrow(DocumentErrorCode.DOCUMENT_NOT_FOUND::raise);
        if (!project.equals(doc.projectId())) throw DocumentErrorCode.DOCUMENT_NOT_FOUND.raise();
        access.requireDocument(
                user, doc, xyz.goraebap.cowork.module.workspace.document.domain.access.Grant.Level.WRITE);
        if (doc.version() != value.expectedVersion()) conflict();
        if (doc.parentId() != null) throw new DomainRuleViolation("하위 페이지는 별도 라벨을 갖지 않습니다");
        requireLabels(project, value.ids());
        if (!documentRepository.save(doc, user.id(), clock.instant())) conflict();
        repository.assign(id, value.ids());
        spaces.signal(id);
    }

    @Transactional
    public UUID view(CurrentUser user, String key, UUID id, SaveView value) {
        var project = managed(user, key);
        requireLabels(project, value.labels());
        xyz.goraebap.cowork.module.workspace.document.domain.Mark.of(value.icon(), value.color());
        var target = id == null ? UUID.randomUUID() : id;
        if ((id == null) != (value.expectedVersion() == null)) conflict();
        if (!repository.saveView(
                project,
                target,
                new View(
                        target,
                        value.name(),
                        value.labels(),
                        value.icon(),
                        value.color(),
                        value.layout(),
                        value.sort(),
                        value.direction(),
                        0),
                value.expectedVersion())) conflict();
        spaces.signal(target);
        return target;
    }

    @Transactional
    public void deleteView(CurrentUser user, String key, UUID id, long version) {
        if (!repository.deleteView(managed(user, key), id, version)) conflict();
        spaces.signal(id);
    }

    /** Puts the project's views in a new order; the ids must be exactly its views now. */
    @Transactional
    public void orderViews(CurrentUser user, String key, LibraryModels.ViewOrder value) {
        var project = managed(user, key);
        var ids = repository.views(project).stream().map(View::id).collect(java.util.stream.Collectors.toSet());
        if (ids.size() != value.ids().size() || !ids.equals(new java.util.HashSet<>(value.ids())))
            throw new DomainRuleViolation("전체 뷰의 순서를 보내 주세요");
        repository.orderViews(project, value.ids());
        spaces.signal(project);
    }

    @Transactional
    public void parent(CurrentUser user, String key, UUID id, LibraryModels.MovePage value) {
        var project = managed(user, key);
        var pages = documentRepository.findAllIncludingDeleted().stream()
                .filter(d -> project.equals(d.projectId()) && !d.isDeleted())
                .collect(java.util.stream.Collectors.toMap(
                        xyz.goraebap.cowork.module.workspace.document.domain.document.Document::id,
                        java.util.function.Function.identity()));
        var document = pages.get(id);
        if (document == null || value.parentId() != null && !pages.containsKey(value.parentId()))
            throw DocumentErrorCode.DOCUMENT_NOT_FOUND.raise();
        if (document.version() != value.expectedVersion()) conflict();
        var parents = new java.util.HashMap<UUID, UUID>();
        pages.values().forEach(page -> {
            if (page.parentId() != null) parents.put(page.id(), page.parentId());
        });
        xyz.goraebap.cowork.module.workspace.document.domain.PageHierarchy.validateMove(id, value.parentId(), parents);
        document.reparent(value.parentId());
        if (!documentRepository.save(document, user.id(), clock.instant())) conflict();
        if (value.parentId() != null) repository.assign(id, List.of());
        spaces.signal(id);
    }

    @Transactional
    public void order(CurrentUser user, String key, SaveOrder value) {
        var project = managed(user, key);
        var documents = rows(user, key);
        if (value.parentId() != null
                && documents.stream().noneMatch(d -> value.parentId().equals(d.id())))
            throw DocumentErrorCode.DOCUMENT_NOT_FOUND.raise();
        var ids = documents.stream()
                .filter(d -> java.util.Objects.equals(value.parentId(), d.parentId()))
                .map(DocumentRow::id)
                .collect(java.util.stream.Collectors.toSet());
        if (value.ids().size() != ids.size() || !new HashSet<>(value.ids()).equals(ids))
            throw new DomainRuleViolation("같은 상위 페이지의 전체 순서를 보내 주세요");
        var current = repository.order(project);
        var merged = new java.util.ArrayList<UUID>();
        int index = 0;
        for (var id : current.ids()) {
            if (ids.contains(id)) {
                if (index < value.ids().size()) merged.add(value.ids().get(index++));
            } else if (documents.stream().anyMatch(d -> d.id().equals(id))) merged.add(id);
        }
        while (index < value.ids().size()) merged.add(value.ids().get(index++));
        for (var d : documents) if (!merged.contains(d.id())) merged.add(d.id());
        if (!repository.order(project, new Order(merged, value.expectedVersion()))) conflict();
        spaces.signal(project);
    }

    private void requireLabels(UUID project, List<UUID> ids) {
        var available = repository.labels().stream().map(Label::id).collect(java.util.stream.Collectors.toSet());
        if (new HashSet<>(ids).size() != ids.size() || !available.containsAll(ids))
            throw new DomainRuleViolation("이 프로젝트의 문서 라벨을 골라 주세요");
    }

    private static void conflict() {
        throw DocumentErrorCode.DOCUMENT_VERSION_CONFLICT.raise();
    }
}

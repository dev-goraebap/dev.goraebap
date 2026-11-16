package xyz.goraebap.workspace.document.application.chapter;

import java.time.Clock;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import xyz.goraebap.workspace.WorkspaceTransactional;
import xyz.goraebap.foundation.user.UserFacade;
import xyz.goraebap.workspace.document.application.DocumentErrorCode;
import xyz.goraebap.workspace.document.application.DocumentSpaces;
import xyz.goraebap.workspace.document.application.access.DocumentAccess;
import xyz.goraebap.workspace.document.domain.access.Grant;
import xyz.goraebap.workspace.document.domain.chapter.ManualChapter;
import xyz.goraebap.workspace.document.domain.chapter.ManualChapterRepository;
import xyz.goraebap.workspace.document.domain.document.Document;
import xyz.goraebap.workspace.document.domain.document.DocumentRepository;
import xyz.goraebap.foundation.shared.web.CurrentUser;

/**
 * The chapters of a 매뉴얼 (docs/pending-records.md, 문서함): every member reads them where they read the manual, any
 * member makes, renames and moves them where they may write it, within the manual and never under itself or a chapter
 * it holds. A new chapter goes last among its siblings; a move puts it at a place and numbers its new siblings again.
 * Deleting a chapter deletes the chapters under it; its maker, the manual's maker or a Workspace administrator may. Each
 * change tells every screen, by the manual's id.
 */
@Service
@RequiredArgsConstructor
public class ChapterService {
    private final ManualChapterRepository manualChapterRepository;
    private final DocumentRepository documentRepository;
    private final ChapterQuery chapterQuery;
    private final DocumentSpaces documentSpaces;
    private final DocumentAccess documentAccess;
    private final UserFacade userFacade;
    private final Clock clock;

    /** Every live chapter of the manual by place, with its last writer's name. */
    @WorkspaceTransactional(readOnly = true)
    public List<ChapterViews.ChapterRow> list(CurrentUser user, UUID documentId) {
        readableManual(user, documentId);
        var rows = chapterQuery.findAll(documentId);
        var ids = rows.stream()
                .map(ChapterViews.ChapterRow::updatedById)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (ids.isEmpty()) return rows;
        var names = userFacade.summariesOf(ids);
        return rows.stream()
                .map(row -> {
                    var found = row.updatedById() == null ? null : names.get(row.updatedById());
                    return row.named(found == null ? null : found.name());
                })
                .toList();
    }

    /** A new chapter, last among its siblings; its id comes back. */
    @WorkspaceTransactional
    public UUID create(CurrentUser user, UUID documentId, ChapterRequests.CreateChapter request) {
        var manual = writableManual(user, documentId);
        var chapters = manualChapterRepository.findAllByDocumentId(manual.id());
        if (request.parentId() != null) requireIn(chapters, request.parentId());
        int last = chapters.stream()
                .filter(chapter -> chapter.isUnder(request.parentId()))
                .mapToInt(ManualChapter::position)
                .max()
                .orElse(-1);
        var chapter = ManualChapter.create(
                UUID.randomUUID(), manual.id(), request.parentId(), last + 1, request.title(), user.id());
        saveAll(List.of(chapter), user.id());
        documentSpaces.signal(manual.id());
        return chapter.id();
    }

    @WorkspaceTransactional
    public void rename(CurrentUser user, UUID id, ChapterRequests.RenameChapter request) {
        var chapter = writable(user, id, request.expectedVersion());
        chapter.rename(request.title());
        saveAll(List.of(chapter), user.id());
        documentSpaces.signal(chapter.documentId());
    }

    /** Puts a chapter under another of its manual at a place, its new siblings numbered again from 0. */
    @WorkspaceTransactional
    public void move(CurrentUser user, UUID id, ChapterRequests.MoveChapter request) {
        var moving = writable(user, id, request.expectedVersion());
        var chapters = manualChapterRepository.findAllByDocumentId(moving.documentId());
        if (request.parentId() != null) {
            requireIn(chapters, request.parentId());
            Map<UUID, ManualChapter> byId =
                    chapters.stream().collect(Collectors.toMap(ManualChapter::id, Function.identity()));
            for (UUID at = request.parentId(); at != null; at = byId.get(at).parentId())
                if (at.equals(moving.id()) || !byId.containsKey(at))
                    throw DocumentErrorCode.DOCUMENT_CHAPTER_MOVE_INVALID.raise();
        }
        var siblings = new ArrayList<>(chapters.stream()
                .filter(chapter -> chapter.isUnder(request.parentId()) && !chapter.equals(moving))
                .toList());
        siblings.add(Math.min(request.index(), siblings.size()), moving);
        var changed = new ArrayList<ManualChapter>();
        for (int position = 0; position < siblings.size(); position++) {
            var chapter = siblings.get(position);
            if (chapter == moving || chapter.position() != position) {
                chapter.placeAt(request.parentId(), position);
                changed.add(chapter);
            }
        }
        saveAll(changed, user.id());
        documentSpaces.signal(moving.documentId());
    }

    /** Deletes the chapter and the chapters under it; its maker, the manual's maker or a Workspace administrator may. */
    @WorkspaceTransactional
    public void delete(CurrentUser user, UUID id, long expectedVersion) {
        var chapter = writable(user, id, expectedVersion);
        var manual = documentRepository.findById(chapter.documentId()).orElseThrow();
        if (!documentSpaces.administers(user, manual.projectId())
                && !chapter.isMadeBy(user.id())
                && !manual.isMadeBy(user.id()))
            throw new AccessDeniedException("장을 만든 사람, 매뉴얼을 만든 사람이나 워크스페이스 관리자만 지울 수 있습니다");
        var chapters = manualChapterRepository.findAllByDocumentId(chapter.documentId());
        Set<UUID> gone = new HashSet<>(Set.of(chapter.id()));
        var deleted = new ArrayList<>(List.of(chapter));
        for (boolean grew = true; grew; ) {
            var under = chapters.stream()
                    .filter(each ->
                            !gone.contains(each.id()) && each.parentId() != null && gone.contains(each.parentId()))
                    .toList();
            grew = !under.isEmpty();
            under.forEach(each -> gone.add(each.id()));
            deleted.addAll(under);
        }
        var now = clock.instant();
        deleted.forEach(each -> each.delete(now));
        saveAll(deleted, user.id());
        documentSpaces.signal(chapter.documentId());
    }

    /** A live chapter of a live 매뉴얼 the member may read. */
    @WorkspaceTransactional(readOnly = true)
    public ManualChapter readable(CurrentUser user, UUID id) {
        var chapter = live(id);
        readableManual(user, chapter.documentId());
        return chapter;
    }

    /** A live chapter of a live 매뉴얼 in a space the member may write in. */
    @WorkspaceTransactional(readOnly = true)
    public ManualChapter writable(CurrentUser user, UUID id) {
        var chapter = live(id);
        writableManual(user, chapter.documentId());
        return chapter;
    }

    private ManualChapter writable(CurrentUser user, UUID id, long expectedVersion) {
        var chapter = writable(user, id);
        if (chapter.version() != expectedVersion) throw DocumentErrorCode.DOCUMENT_CHAPTER_VERSION_CONFLICT.raise();
        return chapter;
    }

    private ManualChapter live(UUID id) {
        return manualChapterRepository
                .findById(id)
                .filter(chapter -> !chapter.isDeleted())
                .orElseThrow(DocumentErrorCode.DOCUMENT_CHAPTER_NOT_FOUND::raise);
    }

    private Document readableManual(CurrentUser user, UUID documentId) {
        var manual = liveManual(documentId);
        documentSpaces.readableOf(user, manual.projectId(), DocumentErrorCode.DOCUMENT_NOT_FOUND);
        documentAccess.requireDocument(user, manual, Grant.Level.READ);
        return manual;
    }

    private Document writableManual(CurrentUser user, UUID documentId) {
        var manual = liveManual(documentId);
        documentSpaces.writableOf(user, manual.projectId(), DocumentErrorCode.DOCUMENT_NOT_FOUND);
        documentAccess.requireDocument(user, manual, Grant.Level.WRITE);
        return manual;
    }

    private Document liveManual(UUID documentId) {
        var document = documentRepository
                .findById(documentId)
                .filter(found -> !found.isDeleted() && found.isWritten())
                .orElseThrow(DocumentErrorCode.DOCUMENT_NOT_FOUND::raise);
        if (!document.isManual()) throw DocumentErrorCode.DOCUMENT_NOT_MANUAL.raise();
        return document;
    }

    private void saveAll(List<ManualChapter> chapters, UUID actor) {
        if (!manualChapterRepository.saveAll(chapters, actor, clock.instant()))
            throw DocumentErrorCode.DOCUMENT_CHAPTER_VERSION_CONFLICT.raise();
    }

    /** The chapter must be a live one of the manual whose chapters are given. */
    private static void requireIn(List<ManualChapter> chapters, UUID chapterId) {
        if (chapters.stream().noneMatch(chapter -> chapter.id().equals(chapterId)))
            throw DocumentErrorCode.DOCUMENT_CHAPTER_NOT_FOUND.raise();
    }
}

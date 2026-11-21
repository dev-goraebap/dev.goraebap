package xyz.goraebap.cowork.module.workspace.document.domain.document;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.cowork.module.workspace.document.domain.Mark;
import xyz.goraebap.cowork.shared.error.DomainRuleViolation;

/**
 * A document of a space, as BIT's 문서: its space (a project's, or the shared one when projectId is null), which never
 * changes, the folder it sits in (none, the space's top), its kind, which never changes either (a page on its own, or a
 * 매뉴얼 whose chapters are read in order), its title and mark, and who made it, who may delete it beside Projects
 * administrators. Its body (a 매뉴얼's cover) is kept apart (the shared body editor's), so typing in it never conflicts
 * with the title or a move. A deleted document is kept, out of every list.
 */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Document {
    public static final int TITLE_MAX = 200;

    /** What a document is: a page on its own or a 매뉴얼 of ordered chapters. */
    public enum Kind {
        PAGE,
        MANUAL
    }

    @EqualsAndHashCode.Include
    private final UUID id;

    private final UUID projectId;
    private UUID folderId;
    private UUID parentId;
    private final Kind kind;
    private String title;
    private Mark mark;
    private final UUID createdBy;
    private Instant deletedAt;
    private final long version;

    public static Document create(
            UUID id, UUID projectId, UUID folderId, Kind kind, String title, Mark mark, UUID createdBy) {
        return new Document(id, projectId, folderId, null, kind, titleOf(title), mark, createdBy, null, 0);
    }

    public static Document fromPersistence(
            UUID id,
            UUID projectId,
            UUID folderId,
            UUID parentId,
            Kind kind,
            String title,
            Mark mark,
            UUID createdBy,
            Instant deletedAt,
            long version) {
        return new Document(id, projectId, folderId, parentId, kind, title, mark, createdBy, deletedAt, version);
    }

    /** The title checked: 1–200 letters once trimmed. */
    public static String titleOf(String value) {
        String title = value == null ? "" : value.strip();
        if (title.isEmpty() || title.length() > TITLE_MAX) throw new DomainRuleViolation("제목은 1~200자입니다");
        return title;
    }

    public void rename(String next) {
        this.title = titleOf(next);
    }

    public void markAs(Mark next) {
        this.mark = next;
    }

    public boolean isManual() {
        return kind == Kind.MANUAL;
    }

    /** Whether it is written in 문서함 (a page or a 매뉴얼), not a system folder's row. */

    /** Puts the document in a folder of its space, or at its top; the caller has checked the folder is the space's. */
    public void moveTo(UUID folderId) {
        this.folderId = folderId;
    }

    public void reparent(UUID parentId) {
        if (id.equals(parentId)) throw new DomainRuleViolation("자기 자신을 상위 페이지로 지정할 수 없습니다");
        this.parentId = parentId;
    }

    public void delete(Instant now) {
        if (deletedAt == null) deletedAt = now;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    /** Whether the member made it. */
    public boolean isMadeBy(UUID member) {
        return createdBy != null && createdBy.equals(member);
    }
}

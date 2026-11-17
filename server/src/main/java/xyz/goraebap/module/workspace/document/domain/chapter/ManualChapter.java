package xyz.goraebap.module.workspace.document.domain.chapter;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.module.workspace.document.domain.document.Document;
import xyz.goraebap.shared.error.DomainRuleViolation;

/**
 * A chapter of a 매뉴얼: the manual (a document of that kind) it belongs to, which never changes, the chapter it sits under
 * (none, the manual's first level), its place among its siblings (position, smaller first), its title and who made it.
 * Its body is kept apart (the shared body editor's), as a document's. A deleted chapter is kept, out of every list.
 */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ManualChapter {
    @EqualsAndHashCode.Include
    private final UUID id;

    private final UUID documentId;
    private UUID parentId;
    private int position;
    private String title;
    private final UUID createdBy;
    private Instant deletedAt;
    private final long version;

    public static ManualChapter create(
            UUID id, UUID documentId, UUID parentId, int position, String title, UUID createdBy) {
        if (id.equals(parentId)) throw new DomainRuleViolation("장을 자신 아래에 둘 수 없습니다");
        return new ManualChapter(id, documentId, parentId, position, Document.titleOf(title), createdBy, null, 0);
    }

    public static ManualChapter fromPersistence(
            UUID id,
            UUID documentId,
            UUID parentId,
            int position,
            String title,
            UUID createdBy,
            Instant deletedAt,
            long version) {
        return new ManualChapter(id, documentId, parentId, position, title, createdBy, deletedAt, version);
    }

    public void rename(String next) {
        this.title = Document.titleOf(next);
    }

    /** Puts the chapter under another of its manual (none, the first level) at a place among its siblings. */
    public void placeAt(UUID parentId, int position) {
        if (id.equals(parentId)) throw new DomainRuleViolation("장을 자신 아래에 둘 수 없습니다");
        this.parentId = parentId;
        this.position = position;
    }

    public void delete(Instant now) {
        if (deletedAt == null) deletedAt = now;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public boolean isUnder(UUID parentId) {
        return Objects.equals(this.parentId, parentId);
    }

    /** Whether the member made it. */
    public boolean isMadeBy(UUID member) {
        return createdBy != null && createdBy.equals(member);
    }
}

package xyz.goraebap.productivity.document.domain.folder;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.productivity.document.domain.Mark;
import xyz.goraebap.shared.error.DomainRuleViolation;

/**
 * A folder of a document space, as BIT's 문서함 folder: a name in a project's space (projectId) or the shared one (null),
 * under another folder of the same space or at its top (parentId null), with its mark. The space never changes; the name has no slash,
 * so a path of names ("설계/화면") finds one folder. A deleted folder is kept, out of every list.
 */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class DocumentFolder {
    public static final int NAME_MAX = 100;

    @EqualsAndHashCode.Include
    private final UUID id;

    private final UUID projectId;
    private UUID parentId;
    private String name;
    private Mark mark;
    private final UUID createdBy;
    private Instant deletedAt;
    private final long version;

    public static DocumentFolder create(
            UUID id, UUID projectId, UUID parentId, String name, Mark mark, UUID createdBy) {
        if (id.equals(parentId)) throw new DomainRuleViolation("폴더를 자신 안에 둘 수 없습니다");
        return new DocumentFolder(id, projectId, parentId, nameOf(name), mark, createdBy, null, 0);
    }

    public static DocumentFolder fromPersistence(
            UUID id,
            UUID projectId,
            UUID parentId,
            String name,
            Mark mark,
            UUID createdBy,
            Instant deletedAt,
            long version) {
        return new DocumentFolder(id, projectId, parentId, name, mark, createdBy, deletedAt, version);
    }

    /** The name checked: 1–100 letters once trimmed, without a slash. */
    public static String nameOf(String value) {
        String name = value == null ? "" : value.strip();
        if (name.isEmpty() || name.length() > NAME_MAX) throw new DomainRuleViolation("폴더 이름은 1~100자입니다");
        if (name.contains("/")) throw new DomainRuleViolation("폴더 이름에 /를 쓸 수 없습니다");
        return name;
    }

    public void rename(String next) {
        this.name = nameOf(next);
    }

    public void markAs(Mark next) {
        this.mark = next;
    }

    /** Puts the folder under another of its space, or at its top; the caller has ruled out a folder it holds. */
    public void moveTo(UUID parentId) {
        if (id.equals(parentId)) throw new DomainRuleViolation("폴더를 자신 안에 둘 수 없습니다");
        this.parentId = parentId;
    }

    public void delete(Instant now) {
        if (deletedAt == null) deletedAt = now;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    /** Whether another name would clash with this folder's among its neighbours, as the unique index compares them. */
    public boolean isNamed(String other) {
        return other != null && name.equalsIgnoreCase(other.strip());
    }

    public boolean isIn(UUID parentId) {
        return Objects.equals(this.parentId, parentId);
    }
}

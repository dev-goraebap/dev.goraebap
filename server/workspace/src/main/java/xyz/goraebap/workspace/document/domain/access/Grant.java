package xyz.goraebap.workspace.document.domain.access;

import java.util.Objects;
import java.util.UUID;
import xyz.goraebap.foundation.shared.error.DomainRuleViolation;

/**
 * One grant on a closed folder or document (docs/pending-records.md, 문서함 ②): who (the item's maker, a member, a
 * department with the departments under it, or a project's members) and how far they go.
 */
public record Grant(Subject subject, UUID subjectId, Level level) {
    /** Who a grant is for. OWNER is the item's maker and has no id; the others name one. */
    public enum Subject {
        OWNER,
        USER,
        DEPARTMENT,
        PROJECT
    }

    /** How far one may go with an item, each level holding the ones before it. NONE: not even see it. */
    public enum Level {
        NONE,
        READ,
        WRITE,
        MANAGE;

        public boolean allows(Level wanted) {
            return compareTo(wanted) >= 0;
        }

        public static Level min(Level one, Level other) {
            return one.compareTo(other) <= 0 ? one : other;
        }

        public static Level max(Level one, Level other) {
            return one.compareTo(other) >= 0 ? one : other;
        }
    }

    public Grant {
        Objects.requireNonNull(subject, "subject");
        Objects.requireNonNull(level, "level");
        if ((subject == Subject.OWNER) != (subjectId == null))
            throw new DomainRuleViolation("만든 사람 외의 대상에는 id가 있어야 합니다");
        if (level == Level.NONE) throw new DomainRuleViolation("권한은 보기 · 쓰기 · 관리 중 하나입니다");
    }
}

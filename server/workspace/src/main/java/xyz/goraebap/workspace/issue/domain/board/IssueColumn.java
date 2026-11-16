package xyz.goraebap.workspace.issue.domain.board;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.foundation.shared.error.DomainRuleViolation;

/** A column of a project's board, one of the statuses its issues move through, in the board's order. */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class IssueColumn {
    public static final int NAME_MAX = 32;

    @EqualsAndHashCode.Include
    private final UUID id;

    private final UUID projectId;
    private String name;
    private ColumnCategory category;
    private int position;

    public static IssueColumn create(UUID id, UUID projectId, String name, ColumnCategory category, int position) {
        var column = new IssueColumn(id, projectId, null, null, position);
        column.revise(name, category);
        return column;
    }

    public static IssueColumn fromPersistence(
            UUID id, UUID projectId, String name, ColumnCategory category, int position) {
        return new IssueColumn(id, projectId, name, category, position);
    }

    /** BIT's board, the one every project starts with: 백로그, 할 일, 진행 중, 검토 중, 완료, 취소. */
    public static List<IssueColumn> defaults(UUID projectId) {
        var columns = new ArrayList<IssueColumn>();
        String[] names = {"백로그", "할 일", "진행 중", "검토 중", "완료", "취소"};
        ColumnCategory[] categories = {
            ColumnCategory.BACKLOG,
            ColumnCategory.UNSTARTED,
            ColumnCategory.STARTED,
            ColumnCategory.STARTED,
            ColumnCategory.COMPLETED,
            ColumnCategory.CANCELED
        };
        for (int index = 0; index < names.length; index++)
            columns.add(create(UUID.randomUUID(), projectId, names[index], categories[index], index));
        return columns;
    }

    public void revise(String name, ColumnCategory category) {
        String next = name == null ? "" : name.strip();
        if (next.isEmpty() || next.length() > NAME_MAX) throw new DomainRuleViolation("상태 이름은 1~32자입니다");
        if (category == null) throw new DomainRuleViolation("상태의 분류를 골라 주세요");
        this.name = next;
        this.category = category;
    }

    public void place(int position) {
        this.position = position;
    }
}

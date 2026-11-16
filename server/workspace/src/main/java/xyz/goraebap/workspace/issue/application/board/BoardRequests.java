package xyz.goraebap.workspace.issue.application.board;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import xyz.goraebap.workspace.issue.domain.board.ColumnCategory;
import xyz.goraebap.workspace.issue.domain.board.IssueColumn;

public final class BoardRequests {
    private BoardRequests() {}

    /** A column, new at the board's end or renamed: its name and what it means. */
    public record ColumnInput(
            @NotBlank @Size(max = IssueColumn.NAME_MAX) String name,
            @NotNull ColumnCategory category) {}

    /** Every column of the project, each once, in the new order. */
    public record ColumnOrder(@NotNull @Size(max = 100) List<@NotNull UUID> ids) {
        public ColumnOrder {
            ids = ids == null ? List.of() : List.copyOf(ids);
        }
    }
}

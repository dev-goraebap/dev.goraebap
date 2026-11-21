package xyz.goraebap.productivity.issue.application.board;

import java.util.UUID;
import xyz.goraebap.productivity.issue.domain.board.ColumnCategory;

public final class BoardViews {
    private BoardViews() {}

    /** A column of the board, the status its issues show, in the board's order. */
    public record ColumnView(UUID id, String name, ColumnCategory category, int position) {}
}

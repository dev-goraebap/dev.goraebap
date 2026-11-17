package xyz.goraebap.module.workspace.issue.application.board;

import java.util.List;

public interface BoardQuery {
    List<BoardViews.ColumnView> workspaceColumns();
}

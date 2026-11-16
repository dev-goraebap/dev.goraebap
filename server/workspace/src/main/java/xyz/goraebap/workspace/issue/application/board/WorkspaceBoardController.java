package xyz.goraebap.workspace.issue.application.board;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** 전역 업무에서 실제 상태 이름과 빈 열을 표시한다. 프로젝트 내부의 열 ID는 그대로 유지한다. */
@RestController
@RequiredArgsConstructor
public class WorkspaceBoardController {
    private final BoardService boardService;

    @GetMapping("/api/v1/workspace/issue-columns")
    public List<BoardViews.ColumnView> columns() {
        return boardService.workspaceColumns();
    }
}

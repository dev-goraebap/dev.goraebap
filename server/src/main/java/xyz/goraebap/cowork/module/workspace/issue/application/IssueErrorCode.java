package xyz.goraebap.cowork.module.workspace.issue.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.goraebap.cowork.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum IssueErrorCode implements ErrorCode {
    ISSUE_PROJECT_NOT_FOUND(HttpStatus.NOT_FOUND, "프로젝트를 찾을 수 없습니다"),
    ISSUE_PROJECT_ARCHIVED(HttpStatus.CONFLICT, "보관한 프로젝트의 이슈는 고칠 수 없습니다"),
    ISSUE_NOT_FOUND(HttpStatus.NOT_FOUND, "이슈를 찾을 수 없습니다"),
    ISSUE_CYCLE_NOT_FOUND(HttpStatus.NOT_FOUND, "사이클을 찾을 수 없습니다"),
    ISSUE_CYCLE_OVERLAP(HttpStatus.CONFLICT, "다른 사이클과 기간이 겹칩니다"),
    ISSUE_CYCLE_COMPLETED(HttpStatus.CONFLICT, "마친 사이클에는 업무를 넣을 수 없습니다"),
    ISSUE_CYCLE_VERSION_CONFLICT(HttpStatus.CONFLICT, "다른 곳에서 사이클이 먼저 바뀌었습니다. 새로 고친 뒤 다시 해 주세요"),
    ISSUE_VERSION_CONFLICT(HttpStatus.CONFLICT, "다른 곳에서 이슈가 먼저 바뀌었습니다. 새로 고친 뒤 다시 해 주세요"),
    ISSUE_PARENT_INVALID(HttpStatus.BAD_REQUEST, "상위 이슈로 둘 수 없는 이슈입니다"),
    ISSUE_ASSIGNEE_NOT_FOUND(HttpStatus.NOT_FOUND, "담당자를 찾을 수 없습니다"),
    ISSUE_COLUMN_NOT_FOUND(HttpStatus.NOT_FOUND, "상태를 찾을 수 없습니다"),
    ISSUE_COLUMN_NOT_EMPTY(HttpStatus.CONFLICT, "이슈가 남아 있는 상태는 지울 수 없습니다. 이슈를 다른 상태로 옮긴 뒤 지워 주세요"),
    ISSUE_COLUMN_LAST(HttpStatus.CONFLICT, "상태는 하나 이상 있어야 합니다"),
    ISSUE_COLUMN_ORDER_MISMATCH(HttpStatus.CONFLICT, "상태 목록이 바뀌었습니다. 새로 고친 뒤 다시 해 주세요"),
    ISSUE_LABEL_NOT_FOUND(HttpStatus.NOT_FOUND, "라벨을 찾을 수 없습니다"),
    ISSUE_LABEL_NAME_CONFLICT(HttpStatus.CONFLICT, "같은 이름의 라벨이 있습니다"),
    ISSUE_TYPE_NOT_FOUND(HttpStatus.NOT_FOUND, "업무 유형을 찾을 수 없습니다"),
    ISSUE_TYPE_NAME_CONFLICT(HttpStatus.CONFLICT, "같은 이름의 유형이 있습니다"),
    ISSUE_TYPE_IN_USE(HttpStatus.CONFLICT, "이 유형을 쓰는 업무가 있어 지울 수 없습니다"),
    ISSUE_FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다"),
    ISSUE_VIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "뷰를 찾을 수 없습니다"),
    ISSUE_VIEW_VERSION_CONFLICT(HttpStatus.CONFLICT, "다른 곳에서 뷰가 먼저 바뀌었습니다. 새로 고친 뒤 다시 해 주세요"),
    ISSUE_VIEW_ORDER_MISMATCH(HttpStatus.CONFLICT, "뷰 목록이 바뀌었습니다. 새로 고친 뒤 다시 해 주세요");
    private final HttpStatus status;
    private final String message;
}

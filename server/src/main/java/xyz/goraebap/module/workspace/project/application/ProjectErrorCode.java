package xyz.goraebap.module.workspace.project.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.goraebap.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum ProjectErrorCode implements ErrorCode {
    PROJECT_NOT_FOUND(HttpStatus.NOT_FOUND, "프로젝트를 찾을 수 없습니다"),
    PROJECT_KEY_CONFLICT(HttpStatus.CONFLICT, "다른 프로젝트가 쓰거나 썼던 키입니다"),
    PROJECT_ARCHIVED(HttpStatus.CONFLICT, "보관한 프로젝트는 고칠 수 없습니다"),
    PROJECT_VERSION_CONFLICT(HttpStatus.CONFLICT, "다른 곳에서 먼저 바뀌었습니다. 새로 고친 뒤 다시 해 주세요"),
    PROJECT_ORDER_MISMATCH(HttpStatus.CONFLICT, "프로젝트 목록이 바뀌었습니다. 새로 고친 뒤 다시 해 주세요"),
    PROJECT_USER_NOT_FOUND(HttpStatus.NOT_FOUND, "구성원을 찾을 수 없습니다"),
    PROJECT_MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "이 프로젝트의 멤버가 아닙니다"),
    PROJECT_ROLE_INVALID(HttpStatus.BAD_REQUEST, "멤버의 역할은 뷰어 · 에디터 · 관리자 가운데 하나입니다"),
    PROJECT_LAST_ADMIN(HttpStatus.CONFLICT, "프로젝트에는 관리자가 한 명 이상 있어야 합니다");
    private final HttpStatus status;
    private final String message;
}

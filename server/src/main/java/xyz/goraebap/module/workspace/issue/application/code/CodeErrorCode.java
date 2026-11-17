package xyz.goraebap.module.workspace.issue.application.code;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.goraebap.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum CodeErrorCode implements ErrorCode {
    INTEGRATION_NOT_FOUND(HttpStatus.NOT_FOUND, "저장소 연결을 찾을 수 없습니다"),
    INTEGRATION_EXISTS(HttpStatus.CONFLICT, "이 저장소가 이미 연결되어 있습니다"),
    INTEGRATION_INVALID(HttpStatus.BAD_REQUEST, "저장소 연결 값이 올바르지 않습니다"),
    INTEGRATION_HOST_REFUSED(HttpStatus.BAD_REQUEST, "저장소 호스트가 요청을 거절했습니다"),
    INTEGRATION_VERSION_CONFLICT(HttpStatus.CONFLICT, "다른 곳에서 저장소 연결이 먼저 바뀌었습니다. 새로 고친 뒤 다시 해 주세요"),
    HOOK_REJECTED(HttpStatus.NOT_FOUND, "받을 수 없는 웹훅입니다");

    private final HttpStatus status;
    private final String message;
}

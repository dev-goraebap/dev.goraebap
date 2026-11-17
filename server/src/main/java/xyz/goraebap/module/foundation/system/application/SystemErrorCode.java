package xyz.goraebap.module.foundation.system.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.goraebap.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum SystemErrorCode implements ErrorCode {
    SYSTEM_LOG_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "로그 저장소에 문제가 있어 기록을 불러오지 못했습니다"),
    SYSTEM_ERROR_NOT_FOUND(HttpStatus.NOT_FOUND, "오류 기록을 찾을 수 없습니다");
    private final HttpStatus status;
    private final String message;
}

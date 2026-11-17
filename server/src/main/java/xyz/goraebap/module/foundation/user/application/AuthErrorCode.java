package xyz.goraebap.module.foundation.user.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.goraebap.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum AuthErrorCode implements ErrorCode {
    AUTH_REQUIRED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다"),
    AUTH_CODE_INVALID(HttpStatus.BAD_REQUEST, "코드가 올바르지 않거나 만료되었습니다. 다시 요청해 주세요"),
    AUTH_RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "잠시 후 인증 코드를 다시 요청해 주세요"),
    AUTH_FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다"),
    AUTH_CSRF_INVALID(HttpStatus.FORBIDDEN, "요청을 확인할 수 없습니다. 화면을 새로고침해 주세요"),
    AUTH_LAST_ADMIN(HttpStatus.CONFLICT, "인스턴스 관리자가 한 명 이상 남아야 합니다. 다른 구성원을 인스턴스 관리자로 먼저 지정해 주세요"),
    AUTH_EMAIL_DUPLICATED(HttpStatus.CONFLICT, "이미 다른 계정이 사용 중인 이메일입니다"),
    AUTH_NOT_FOUND(HttpStatus.NOT_FOUND, "대상을 찾을 수 없습니다");
    private final HttpStatus status;
    private final String message;
}

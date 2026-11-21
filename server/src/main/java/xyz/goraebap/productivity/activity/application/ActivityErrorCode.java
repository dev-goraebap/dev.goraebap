package xyz.goraebap.productivity.activity.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.goraebap.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum ActivityErrorCode implements ErrorCode {
    ACTIVITY_COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다");

    private final HttpStatus status;
    private final String message;
}

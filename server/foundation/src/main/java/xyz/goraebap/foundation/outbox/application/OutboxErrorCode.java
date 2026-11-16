package xyz.goraebap.foundation.outbox.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.goraebap.foundation.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum OutboxErrorCode implements ErrorCode {
    OUTBOX_NOT_FOUND(HttpStatus.NOT_FOUND, "처리하지 못한 일을 찾을 수 없습니다"),
    OUTBOX_NOT_FAILED(HttpStatus.CONFLICT, "실패한 일만 다시 시도하거나 버릴 수 있습니다");
    private final HttpStatus status;
    private final String message;
}

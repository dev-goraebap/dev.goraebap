package xyz.goraebap.foundation.notification.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.goraebap.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum NotificationErrorCode implements ErrorCode {
    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "알림을 찾을 수 없습니다"),
    PUSH_NOT_CONFIGURED(HttpStatus.CONFLICT, "이 서버에는 푸시 알림이 설정되지 않았습니다"),
    PUSH_DEVICE_NOT_FOUND(HttpStatus.NOT_FOUND, "알림 받는 기기를 찾을 수 없습니다"),
    PUSH_NO_DEVICE(HttpStatus.CONFLICT, "알림을 받도록 켠 기기가 없습니다"),
    PUSH_MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "구성원을 찾을 수 없습니다");
    private final HttpStatus status;
    private final String message;
}

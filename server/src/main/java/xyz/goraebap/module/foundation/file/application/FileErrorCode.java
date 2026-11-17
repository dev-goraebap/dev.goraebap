package xyz.goraebap.module.foundation.file.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.goraebap.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum FileErrorCode implements ErrorCode {
    FILE_UPLOAD_MISSING(HttpStatus.BAD_REQUEST, "올린 파일을 찾을 수 없습니다. 파일을 다시 올려 주세요"),
    FILE_NOT_STORED(HttpStatus.BAD_REQUEST, "파일 업로드가 끝나지 않았습니다. 파일을 다시 올려 주세요"),
    FILE_PICTURE_INVALID(HttpStatus.BAD_REQUEST, "사진을 읽을 수 없습니다. 다른 사진을 골라 주세요"),
    FILE_TOTAL_EXCEEDED(HttpStatus.BAD_REQUEST, "파일은 모두 합쳐 10MB까지 올릴 수 있습니다");
    private final HttpStatus status;
    private final String message;
}

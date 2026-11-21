package xyz.goraebap.cowork.module.workspace.richbody.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.goraebap.cowork.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum RichBodyErrorCode implements ErrorCode {
    RICH_BODY_VERSION_CONFLICT(HttpStatus.CONFLICT, "다른 곳에서 본문이 먼저 바뀌었습니다"),
    RICH_BODY_BLOCK_CONFLICT(HttpStatus.CONFLICT, "다른 곳에서 같은 블록이 먼저 바뀌었습니다"),
    RICH_BODY_INVALID(HttpStatus.BAD_REQUEST, "본문 형식이 올바르지 않습니다"),
    RICH_BODY_BLOCKS_MISSING(HttpStatus.BAD_REQUEST, "본문의 보존 표시가 빠졌습니다"),
    RICH_BODY_LINK_INVALID(HttpStatus.BAD_REQUEST, "https://로 시작하는 웹 주소가 아닙니다"),
    RICH_BODY_FILE_UNKNOWN(HttpStatus.BAD_REQUEST, "첨부를 찾을 수 없습니다. 파일을 올리지 않았거나 하루가 지났거나 다른 사람이 올린 파일입니다"),
    RICH_BODY_REVISION_NOT_FOUND(HttpStatus.NOT_FOUND, "버전을 찾을 수 없습니다");
    private final HttpStatus status;
    private final String message;
}

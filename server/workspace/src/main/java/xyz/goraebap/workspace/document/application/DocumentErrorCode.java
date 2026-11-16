package xyz.goraebap.workspace.document.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.goraebap.foundation.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum DocumentErrorCode implements ErrorCode {
    DOCUMENT_PROJECT_NOT_FOUND(HttpStatus.NOT_FOUND, "프로젝트를 찾을 수 없습니다"),
    DOCUMENT_LABEL_NAME_CONFLICT(HttpStatus.CONFLICT, "같은 이름의 문서 라벨이 있습니다"),
    DOCUMENT_PROJECT_ARCHIVED(HttpStatus.CONFLICT, "보관한 프로젝트의 문서는 고칠 수 없습니다"),
    DOCUMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "문서를 찾을 수 없습니다"),
    DOCUMENT_VERSION_CONFLICT(HttpStatus.CONFLICT, "다른 곳에서 문서가 먼저 바뀌었습니다. 새로 고친 뒤 다시 해 주세요"),
    DOCUMENT_BODY_INVALID(HttpStatus.BAD_REQUEST, "본문은 본문 JSON과 Markdown 중 하나로 주세요"),
    DOCUMENT_FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다"),
    DOCUMENT_FOLDER_NOT_FOUND(HttpStatus.NOT_FOUND, "폴더를 찾을 수 없습니다"),
    DOCUMENT_FOLDER_VERSION_CONFLICT(HttpStatus.CONFLICT, "다른 곳에서 폴더가 먼저 바뀌었습니다. 새로 고친 뒤 다시 해 주세요"),
    DOCUMENT_FOLDER_NAME_CONFLICT(HttpStatus.CONFLICT, "같은 자리에 같은 이름의 폴더가 있습니다"),
    DOCUMENT_FOLDER_MOVE_INVALID(HttpStatus.BAD_REQUEST, "폴더를 자신이나 자신 안의 폴더로 옮길 수 없습니다"),
    DOCUMENT_FOLDER_NOT_EMPTY(HttpStatus.CONFLICT, "폴더 안에 문서나 폴더가 있습니다. 먼저 옮기거나 지워 주세요"),
    DOCUMENT_NOT_MANUAL(HttpStatus.CONFLICT, "매뉴얼에만 장을 둘 수 있습니다"),
    DOCUMENT_CHAPTER_NOT_FOUND(HttpStatus.NOT_FOUND, "장을 찾을 수 없습니다"),
    DOCUMENT_CHAPTER_VERSION_CONFLICT(HttpStatus.CONFLICT, "다른 곳에서 장이 먼저 바뀌었습니다. 새로 고친 뒤 다시 해 주세요"),
    DOCUMENT_CHAPTER_MOVE_INVALID(HttpStatus.BAD_REQUEST, "장을 자신이나 자신 아래의 장으로 옮길 수 없습니다"),
    DOCUMENT_ACCESS_SUBJECT_NOT_FOUND(HttpStatus.BAD_REQUEST, "권한을 줄 사람 · 부서 · 프로젝트를 찾을 수 없습니다"),
    DOCUMENT_ACCESS_LOCKOUT(HttpStatus.BAD_REQUEST, "자신의 관리 권한이 사라지게 바꿀 수 없습니다");
    private final HttpStatus status;
    private final String message;
}

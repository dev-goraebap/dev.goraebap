package xyz.goraebap.foundation.user.application.agenttoken;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.goraebap.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum AgentTokenErrorCode implements ErrorCode {
    AGENT_TOKEN_SIGN_IN_AGAIN(HttpStatus.FORBIDDEN, "로그인 상태를 확인한 뒤 다시 시도해 주세요"),
    AGENT_TOKEN_LIMIT(HttpStatus.CONFLICT, "에이전트 토큰은 20개까지 만들 수 있습니다. 쓰지 않는 토큰을 폐기한 뒤 만들어 주세요"),
    AGENT_PROFILE_NOT_FOUND(HttpStatus.NOT_FOUND, "에이전트를 찾을 수 없습니다"),
    AGENT_PROFILE_ALREADY_CONNECTED(HttpStatus.CONFLICT, "이미 토큰이 발급된 에이전트입니다"),
    AGENT_PROFILE_INACTIVE(HttpStatus.CONFLICT, "사용 중인 에이전트만 수정할 수 있습니다"),
    AGENT_TOKEN_EXPIRY_INVALID(HttpStatus.BAD_REQUEST, "오늘 이후의 만료일을 선택해 주세요"),
    AGENT_PROFILE_VERSION_CONFLICT(HttpStatus.CONFLICT, "에이전트 정보가 바뀌었습니다. 다시 불러와 주세요"),
    AGENT_TOKEN_NOT_FOUND(HttpStatus.NOT_FOUND, "에이전트 토큰을 찾을 수 없습니다");
    private final HttpStatus status;
    private final String message;
}

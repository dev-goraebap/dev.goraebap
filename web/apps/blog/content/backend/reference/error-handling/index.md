---
title: 에러 처리
summary: 백엔드 API의 에러 응답 형식, 예외 분류, 에러 코드 규칙, 요청 추적(traceId) 기준입니다.
order: 4
icon: warning
---

## 에러 응답 형식 (Problem Details)

모든 에러 응답은 RFC 9457(`application/problem+json`) 형식을 따릅니다.

```json
{
  "title": "Bad Request",
  "status": 400,
  "detail": "요청이 올바르지 않습니다",
  "code": "COMMON_INVALID_REQUEST",
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "errors": [
    { "field": "email", "message": "올바른 형식이 아닙니다" }
  ]
}
```

| 필드 | 필수 | 설명 |
| --- | :---: | --- |
| `title` | O | HTTP 상태 코드의 표준 문구 |
| `status` | O | HTTP 상태 코드 숫자 |
| `detail` | O | 사용자에게 그대로 노출해도 안전한 안내 문구 |
| `code` | O | 클라이언트가 분기 처리할 기계 판독용 에러 코드 (`<PREFIX>_<REASON>`) |
| `traceId` | O | 서버 로그와 대조할 요청 추적 ID |
| `errors` | 선택 | 입력 검증·바인딩 실패 시 `{ field, message }` 목록 |

- `detail`과 `errors[].message`에는 내부 클래스명, 스택 트레이스, SQL 오류, 사용자가 보낸 잘못된 원문 값을 그대로 담지 않습니다.
- 보안 필터나 웹 서버가 애플리케이션 진입 전에 거절한 오류도 동일한 JSON 형식과 `application/problem+json`으로 응답합니다.

## 예외 분류와 발생 계층

| 예외 유형 | 발생 계층 | 역할 | HTTP 변환 |
| --- | --- | --- | --- |
| 도메인 규칙 위반 (`DomainRuleViolation`) | `domain` | 프레임워크와 HTTP를 모르는 순수 비즈니스 불변식 위반 | `400 Bad Request` (`COMMON_INVALID_REQUEST`) |
| 비즈니스 예외 (`BusinessException`) | `application` | 상태·권한·부재·충돌 등 유스케이스 오류 (`ErrorCode` 동반) | `ErrorCode`에 지정된 상태 코드와 `code` |
| 입력 검증·바인딩 오류 | 진입 계층 | 요청 스키마, 타입 변환, JSON 파싱 실패 | `400 Bad Request` (`COMMON_INVALID_REQUEST` + `errors`) |
| 데이터 무결성 충돌 | 영속성 계층 | DB 유일성 제약·외래키 충돌 | `409 Conflict` (`COMMON_CONFLICT`) |
| 처리되지 않은 예외 | 전역 | 예상하지 못한 런타임·인프라 장애 | `500 Internal Server Error` (`COMMON_INTERNAL_ERROR`) |

- `domain` 계층은 HTTP 상태 코드나 `ErrorCode`를 알지 못합니다. 규칙 위반 시 메시지만 담은 `DomainRuleViolation`을 던집니다.
- `application` 계층은 `ErrorCode`를 통해 `BusinessException`을 발생시킵니다.

## 에러 코드 규칙

- 에러 코드 문자열은 대문자 스네이크 케이스 `<접두사>_<사유>`로 작성합니다.
- HTTP 공통 오류(`400`, `404`, `405`, `406`, `409`, `415`, `500`, `503`)는 `shared`의 공통 에러 코드(`COMMON_*`)를 사용합니다.
- 컨텍스트 고유 오류는 해당 컨텍스트의 `application/` 아래 `*ErrorCode`로 정의하고, 컨텍스트 이름 접두사를 붙입니다(예: `AUTH_*`, `FILE_*`, `ORDER_*`).

## 로깅과 요청 추적 (`traceId`)

- 모든 요청은 진입 최상단에서 고유 `traceId`(UUID)를 발급해 로그 컨텍스트(MDC 등), 응답 헤더(`X-Trace-Id`), 에러 응답 본문에 동일하게 기록합니다.
- 요청 처리가 끝나면 로그 컨텍스트의 `traceId`를 반드시 정리합니다.
- `4xx` 클라이언트 오류와 예상된 비즈니스 예외는 `error` 레벨로 기록하지 않습니다.
- DB 무결성 충돌(`409`)은 `warn`, 처리되지 않은 예외(`500`)는 스택 트레이스와 `traceId`를 함께 `error` 레벨로 기록합니다.

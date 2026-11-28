# 에러 처리 (Spring Boot)

## 예외와 에러 코드 구성 (`shared.error`)

- `ErrorCode` 인터페이스: `status()`, `message()`, `code()`와 `BusinessException`을 생성하는 기본 메서드 `raise()`, `raise(String detail)`를 제공합니다.
- `CommonErrorCode` enum: `COMMON_INVALID_REQUEST`, `COMMON_NOT_FOUND`, `COMMON_CONFLICT`, `COMMON_INTERNAL_ERROR` 등 공통 HTTP 오류를 정의합니다.
- `BusinessException`: `ErrorCode`를 감싸는 `RuntimeException`입니다. 생성자는 패키지 전용으로 두고 `ErrorCode.raise()`로만 생성합니다.
- `DomainRuleViolation`: Spring 의존이 없는 순수 `RuntimeException`입니다. `domain` 패키지에서 불변식 위반 시 던집니다.

### 컨텍스트 전용 `ErrorCode`

```java
@Getter
@RequiredArgsConstructor
public enum FileErrorCode implements ErrorCode {
    FILE_UPLOAD_MISSING(HttpStatus.BAD_REQUEST, "올린 파일을 찾을 수 없습니다. 파일을 다시 올려 주세요"),
    FILE_NOT_STORED(HttpStatus.BAD_REQUEST, "파일 업로드가 끝나지 않았습니다. 파일을 다시 올려 주세요");

    private final HttpStatus status;
    private final String message;
}
```

유스케이스에서는 `throw FileErrorCode.FILE_UPLOAD_MISSING.raise();` 형태로 발생시킵니다.

## 전역 예외 처리 (`shared.web`)

| 구성 요소 | 역할 |
| - | - |
| `GlobalExceptionHandler` | `ResponseEntityExceptionHandler`를 상속한 `@RestControllerAdvice`. MVC 내부의 모든 예외를 `ProblemDetail`로 변환 |
| `ProblemResponse` | Spring MVC 바깥(보안 필터, 서블릿 오류 페이지, Tomcat 거부)의 오류를 동일한 `application/problem+json` 형식으로 직렬화 |
| `ProblemErrorController` · `ProblemErrorReportValve` | 서블릿 컨테이너 오류와 기본 `/error` 경로를 `ProblemResponse`로 통일 |
| `ValidationWords` | Bean Validation 제약 위반과 바인딩 실패를 계약된 한국어 필드 메시지로 변환 |
| `TraceIdFilter` | `Ordered.HIGHEST_PRECEDENCE`의 `OncePerRequestFilter`. `MDC`와 `X-Trace-Id` 헤더에 `traceId` 기록 후 `finally`에서 제거 |

### Spring 예외 매핑 규칙

| Spring 예외 | 응답 상태 | `code` | `errors` |
| - | :-: | - | :-: |
| `BusinessException` | `errorCode.status()` | `errorCode.code()` | 없음 |
| `DomainRuleViolation` · `IllegalArgumentException` | `400` | `COMMON_INVALID_REQUEST` | 없음 |
| `MethodArgumentNotValidException` · `HandlerMethodValidationException` · `ConstraintViolationException` | `400` | `COMMON_INVALID_REQUEST` | 필드 목록 |
| `HttpMessageNotReadableException` · `TypeMismatchException` · `MissingServletRequestParameterException` | `400` | `COMMON_INVALID_REQUEST` | 해당 필드(식별 가능 시) |
| `AccessDeniedException` | `403` | `AUTH_FORBIDDEN` | 없음 |
| `DataIntegrityViolationException` | `409` | `COMMON_CONFLICT` | 없음 (`warn` 로그) |
| 그 외 `Exception` | `500` | `COMMON_INTERNAL_ERROR` | 없음 (`error` 로그) |

- `ResponseEntityExceptionHandler.handleExceptionInternal`을 재정의해 Spring이 기본 생성하는 `ProblemDetail`에도 `code`와 `traceId`를 주입하고, 내부 클래스나 입력값을 노출할 수 있는 기본 `detail`을 `CommonErrorCode` 문구로 교체합니다.
- `ConstraintViolation`의 경로에서 클라이언트가 알지 못하는 메서드명·파라미터 접두사(`submit.request.startDate` → `startDate`)는 제거해 반환합니다.
- JSON 역직렬화 실패(`HttpMessageNotReadableException`)는 `JacksonException` 경로를 추적해 실패한 필드 경로(예: `items[0].date`)만 `errors`에 담습니다.

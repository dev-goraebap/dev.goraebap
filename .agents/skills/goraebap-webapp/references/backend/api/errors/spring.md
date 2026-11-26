# 도메인 오류와 서비스 오류 (spring)

공통 규칙은 [index.md](index.md)에 있습니다.

## example

출처: [server/src/main/java/xyz/goraebap/cowork/shared/error/ErrorCode.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/error/ErrorCode.java)

```java
public interface ErrorCode {
    // …
    default BusinessException raise() {
        return new BusinessException(this, message());
    }
    // …
}
```

출처: [server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/application/IssueErrorCode.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/application/IssueErrorCode.java)

```java
@Getter
@RequiredArgsConstructor
public enum IssueErrorCode implements ErrorCode {
    ISSUE_PROJECT_NOT_FOUND(HttpStatus.NOT_FOUND, "프로젝트를 찾을 수 없습니다"),
    ISSUE_PROJECT_ARCHIVED(HttpStatus.CONFLICT, "보관한 프로젝트의 이슈는 고칠 수 없습니다"),
    ISSUE_NOT_FOUND(HttpStatus.NOT_FOUND, "이슈를 찾을 수 없습니다"),
    // …
    private final HttpStatus status;
    private final String message;
}
```

모듈마다 application 루트에 `ErrorCode`를 구현한 열거형 하나를 두고, 서비스는 `IssueErrorCode.ISSUE_NOT_FOUND.raise()`처럼 업무 예외를 만듭니다. 상태 코드와 사용자에게 보일 문구는 코드마다 정해 둡니다.

출처: [server/src/main/java/xyz/goraebap/cowork/shared/web/GlobalExceptionHandler.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/web/GlobalExceptionHandler.java)

```java
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
    // …
    @ExceptionHandler(BusinessException.class)
    ProblemDetail handleBusiness(BusinessException businessException, HttpServletRequest httpServletRequest) {
        return toProblemDetail(businessException.errorCode(), businessException.getMessage(), httpServletRequest);
    }

    @ExceptionHandler(DomainRuleViolation.class)
    ProblemDetail handleDomainRule(DomainRuleViolation domainRuleViolation, HttpServletRequest httpServletRequest) {
        return toProblemDetail(
                CommonErrorCode.COMMON_INVALID_REQUEST, domainRuleViolation.getMessage(), httpServletRequest);
    }
    // …
    private static ProblemDetail toProblemDetail(
            ErrorCode errorCode, String detail, HttpServletRequest httpServletRequest) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(errorCode.status(), detail);
        problemDetail.setInstance(URI.create(httpServletRequest.getRequestURI()));
        problemDetail.setProperty("code", errorCode.code());
        problemDetail.setProperty("traceId", MDC.get(TraceIdFilter.MDC_KEY));
        return problemDetail;
    }
    // …
}
```

출처: [server/src/main/java/xyz/goraebap/cowork/shared/web/ProblemResponse.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/web/ProblemResponse.java)

```java
public final class ProblemResponse {
    // …
    public static String prepare(HttpServletResponse response, int status, ErrorCode errorCode) {
        // Without a type, as Spring writes its problems: RFC 9457 reads a missing type as about:blank.
        Map<String, Object> body = new LinkedHashMap<>();
        HttpStatus httpStatus = HttpStatus.resolve(status);
        body.put("title", (httpStatus == null ? errorCode.status() : httpStatus).getReasonPhrase());
        body.put("status", status);
        body.put("detail", errorCode.message());
        body.put("code", errorCode.code());
        body.put("traceId", traceIdOf(response));
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        return JSON_MAPPER.writeValueAsString(body);
    }
    // …
}
```

`GlobalExceptionHandler`는 업무 예외를 그 코드의 상태로, `DomainRuleViolation`을 400 응답인 `COMMON_INVALID_REQUEST`로 바꾸고 본문에 안정된 `code`와 `traceId`를 싣습니다. Spring MVC 밖에서 답하는 오류는 `ProblemResponse`가 같은 필드와 `application/problem+json` 형식으로 씁니다.

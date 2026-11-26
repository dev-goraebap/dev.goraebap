# 오류 응답 problem+json

서비스는 부재·권한·충돌을 모듈 ErrorCode를 가진 업무 예외로, 도메인은 규칙 위반 예외로 던지고, 공통 HTTP 경계가 둘을 `application/problem+json` 응답으로 바꿉니다. 규칙은 [도메인 오류와 서비스 오류](../references/errors.md)와 [API 계약](../references/api.md)에 있습니다.

## spring

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

## react

출처: [web/src/shared/api/http.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/api/http.ts)

```ts
export class ApiError extends Error {
  /**
   * `isBadAddress` marks a read refused because a value in its path does not read (an id that is no id, such as
   * /approvals/abc): the address names nothing, as a 404 would say.
   */
  constructor(public readonly status: number, message: string, public readonly code?: string, public readonly isBadAddress = false) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * A read the server answered with 404, or refused because a value in its path does not read: the address or the thing
 * it names is not there, so retrying will not help.
 */
export const isNotFound = (error: unknown): boolean => error instanceof ApiError && (error.status === 404 || error.isBadAddress);
// …
export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, credentials: 'same-origin', headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw await failure(response, url);
  }
  return response.json() as Promise<T>;
}
// …
async function failure(response: Response, readUrl?: string): Promise<ApiError> {
  const { status } = response;
  // …
  const problem = await readProblem(response);
  // …
  if (problem?.code && problem.detail && ((status < 500 && (businessCode.test(problem.code) || adminAuthCodes.has(problem.code))) || (status === 503 && pdfUnavailableCodes.has(problem.code)))) return new ApiError(status, problem.detail, problem.code);
  const badAddress = status === 400 && readUrl !== undefined && blamesPath(readUrl, problem?.fields ?? []);
  // …
  return new ApiError(status, fallback, problem?.code, badAddress);
}

async function readProblem(response: Response): Promise<{ code?: string; detail?: string; fields: string[] } | undefined> {
  try {
    const body: unknown = await response.json();
    if (typeof body !== 'object' || body === null) return undefined;
    const { code, detail, errors } = body as Record<string, unknown>;
    // Only the names of the fields at fault are kept, never what was sent.
    const fields = Array.isArray(errors)
      ? errors.map(error => (typeof error === 'object' && error !== null ? (error as Record<string, unknown>).field : undefined))
        .filter((field): field is string => typeof field === 'string')
      : [];
    return { code: typeof code === 'string' ? code : undefined, detail: typeof detail === 'string' ? detail : undefined, fields };
  } catch {
    return undefined;
  }
}
```

화면은 응답의 `code`와 `detail`을 읽어 `ApiError`로 받습니다. 모듈 업무 코드면 서버가 준 문구를 그대로 보이고, 그 밖에는 상태 코드별 공통 문구를 씁니다. 404와 경로 값이 읽히지 않는 400은 `isNotFound`로 함께 다루며, 필드 오류에서는 보낸 값 없이 필드 이름만 남깁니다.

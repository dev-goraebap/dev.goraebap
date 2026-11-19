---
arc42: "8.1"
---

# cowork: API

cowork는 프로젝트·업무·문서를 다루는 설치형 작업 공간입니다. 이 파일은 [API 지침](../../../api/SKILL.md)을 cowork에 적용한 모양을 담습니다.

## 스택과 고른 이유

- 서버는 Spring Boot 4.1.1의 MVC 컨트롤러로 HTTP 계약을 내고, springdoc-openapi 3.1.1이 컨트롤러에서 OpenAPI 문서를 만듭니다. 계약의 원본이 서버 코드 하나라 문서와 구현이 따로 놀지 않습니다.
- 화면은 openapi-typescript 7.13.0으로 그 문서에서 TypeScript 타입을 만듭니다. 생성 타입은 손으로 고치지 않습니다.

## 지침을 어떻게 적용했나

| 지침 | cowork |
| --- | --- |
| API를 바꾸면 OpenAPI·생성 클라이언트 타입·호출자를 같은 변경에서 맞춥니다 | `server/`에서 `./gradlew exportOpenApi`가 `server/openapi.json`을 쓰고, `web/`에서 `npm run api:generate`가 그 파일로 `web/src/shared/api/schema.d.ts`를 만듭니다. 두 파일 모두 저장소에 커밋합니다 |
| 자원 경로와 접두사 | 공개 HTTP 계약은 `/api/v1/` 아래에 둡니다(예: `/api/v1/files`, `/api/v1/notifications`). OpenAPI 문서는 이 경로만 담습니다(`springdoc.paths-to-match=/api/v1/**`). MCP 서버는 `/api/mcp`로 계약 밖에 둡니다 |
| 오류는 `application/problem+json`, 안정된 오류 코드 | `GlobalExceptionHandler`가 `ProblemDetail`을 만들고 `code`(오류 코드)와 `traceId`를 속성으로 싣습니다. 필드 오류는 `errors`에 담습니다. 공통 코드는 `CommonErrorCode`, 모듈 코드는 모듈마다 `IssueErrorCode`처럼 `ErrorCode`를 구현한 열거형에 둡니다 |
| 도메인 규칙 위반은 공통 HTTP 경계에서 400 | 도메인은 `DomainRuleViolation`만 던지고, `GlobalExceptionHandler`가 `COMMON_INVALID_REQUEST`(400)로 바꿉니다 |
| 프레임워크가 직접 답하는 오류도 같은 모양 | MVC 밖에서 답하는 404·405·406·415 등도 `ProblemResponse`가 같은 공통 코드와 문구로 답합니다 |
| 대상 응답에 할 수 있는 일을 싣습니다 | 프로젝트 응답의 `can`은 `ProjectViews.Can(view, edit, manage)`이며, 역할·보관·삭제 상태로 계산합니다. 화면은 이 값으로 단추를 숨기고, 판정은 서버가 다시 합니다 |
| 목록의 페이지/커서 계약 | 여러 키로 정렬한 목록은 키셋(`Keyset`)으로 읽고, 마지막 행의 정렬 값을 담은 `Cursor`를 돌려줍니다. 다른 정렬의 커서나 읽을 수 없는 커서는 잘못된 요청입니다 |
| 화면의 오류 처리 | 화면은 `web/src/shared/api/http.ts`의 `ApiError`(상태, `code`)로 응답을 받고, `isNotFound`로 404와 읽을 수 없는 주소를 같이 다룹니다 |

## 코드 위치

- HTTP 계약: [server/openapi.json](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/openapi.json)
- 계약 내보내기 태스크: [server/build.gradle](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/build.gradle)의 `exportOpenApi`, 실제로 쓰는 테스트 [FoundationApiTest.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/test/java/xyz/goraebap/cowork/FoundationApiTest.java)
- 생성 타입: [web/src/shared/api/schema.d.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/api/schema.d.ts)
- 화면의 HTTP 호출: [web/src/shared/api/http.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/api/http.ts)
- 오류 응답: [GlobalExceptionHandler.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/web/GlobalExceptionHandler.java), [ProblemResponse.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/web/ProblemResponse.java), [shared/error](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/error)
- 할 수 있는 일(`can`): [ProjectViews.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/project/application/ProjectViews.java)
- 커서 목록: [Keyset.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/web/Keyset.java), [Cursor.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/web/Cursor.java)
- 오류 계약 테스트: [ApiErrorContractTest.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/test/java/xyz/goraebap/cowork/ApiErrorContractTest.java), [RawHttpErrorContractTest.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/test/java/xyz/goraebap/cowork/RawHttpErrorContractTest.java)

## 작업 절차

API를 바꾼 뒤 계약과 생성 타입을 다시 만듭니다.

```bash
cd server && ./gradlew exportOpenApi
cd ../web && npm run api:generate
```

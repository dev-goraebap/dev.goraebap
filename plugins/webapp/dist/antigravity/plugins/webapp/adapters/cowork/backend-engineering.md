---
arc42: "8.2, 8.1, 8.3, 5, 2, 7"
---

# cowork: 백엔드 엔지니어링

cowork는 프로젝트·업무·문서를 다루는 설치형 작업 공간입니다. 이 파일은 [백엔드 엔지니어링 지침](../../skills/backend-engineering/SKILL.md)을 cowork 서버(`server/`)에 적용한 모양을 담습니다. [API 계약](../../skills/backend-engineering/references/api.md)과 [DB와 마이그레이션](../../skills/backend-engineering/references/database.md)의 적용도 이 파일에 함께 둡니다.

## 스택과 고른 이유

- Java 21, Spring Boot 4.1.1, jOOQ 3.21.6, Flyway, SQLite(`sqlite-jdbc`), Lombok입니다. 빌드는 Gradle입니다.
- jOOQ 코드는 실행 중인 DB 없이 마이그레이션 SQL에서 만듭니다(`DDLDatabase`). 빌드가 외부 상태에 기대지 않고, 스키마와 코드가 어긋나면 컴파일이 실패합니다. 생성물은 `build/` 아래에만 두고 커밋하지 않습니다.
- 코드 검사는 세 도구가 나눠 맡습니다. 포맷은 Spotless(palantir-java-format), 이름·모양 규칙은 Checkstyle, 결함 패턴은 SpotBugs입니다. 생성 코드는 셋 모두에서 뺍니다.

- 서버는 Spring Boot 4.1.1의 MVC 컨트롤러로 HTTP 계약을 내고, springdoc-openapi 3.1.1이 컨트롤러에서 OpenAPI 문서를 만듭니다. 계약의 원본이 서버 코드 하나라 문서와 구현이 따로 놀지 않습니다.
- 화면은 openapi-typescript 7.13.0으로 그 문서에서 TypeScript 타입을 만듭니다. 생성 타입은 손으로 고치지 않습니다.

- 마이그레이션은 Flyway(Spring Boot 4.1.1의 starter), 쿼리 코드는 jOOQ 3.21.6, DB 엔진은 SQLite(`sqlite-jdbc`)입니다. jOOQ 런타임 판을 코드 생성기 버전과 맞춥니다(`ext['jooq.version']`). 어긋나면 생성물이 런타임 API와 맞지 않습니다.
- SQLite를 고른 이유는 설치형 제품이라 DB 서버 없이 파일 하나로 띄우기 위해서입니다. 다른 프로젝트에 이 엔진 선택을 옮기지 않습니다.
- DB는 파일 두 개입니다. 업무 DB(`DB_PATH`, `db/migration`)는 Spring Boot의 Flyway 설정이, 시스템 현황용 로그 DB(`LOG_DB_PATH`, `db/logs`)는 `LogDatabase`가 따로 Flyway로 올립니다.

## 지침을 어떻게 적용했나

### 모듈과 계층

| 지침 | cowork |
| --- | --- |
| 모듈형 모놀리스, 모듈은 단수 이름 | 기본 패키지 `xyz.goraebap.cowork` 아래를 기술 기반 `shared`와 업무 모듈 `module`로 나눕니다. 모듈은 `user`·`file`·`notification`·`system`·`seed`·`realtime`·`search`·`mcp`와 `workspace`(`project`·`issue`·`document`·`richbody`·`activity`)입니다 |
| 모듈 안을 application·domain·infrastructure로 | 예: `module/workspace/issue/application`, `…/issue/domain`, `…/issue/infrastructure`. application과 domain은 피처·애그리거트별 하위 패키지(`board`·`cycle`·`issue`·`label` …)로 나눕니다 |
| 모듈 루트의 Facade·Spi·Event가 공개 계약 | `ProjectFacade`·`ProjectSetupSpi`·`ProjectAccess`와 공개 값 `ProjectSummary`·`NewProject`·`ProjectRole`이 `module/workspace/project` 루트에 있습니다. 사건은 `ActivityEvent`처럼 둡니다 |
| Facade 구현은 선언 모듈의 application에 | `ProjectFacade`는 `project/application/ProjectService`가 구현합니다 |
| Spi는 선언 모듈 밖에서 구현 | `ProjectSetupSpi`(프로젝트를 만든 트랜잭션 안에서 알림)를 issue 모듈의 `BoardSetup`·`SavedViewSetup`이 구현해 보드·저장한 보기를 함께 만듭니다 |
| 접근 권한 검사기 하나 | `ProjectAccess`(모듈 루트의 인터페이스)를 `ProjectAccessService`가 구현합니다. 이슈·문서·주기·보드·검색·에이전트 도구가 모두 여기에 묻습니다 |

### 이름과 코드 규칙

| 지침 | cowork |
| --- | --- |
| 저장소·조회 구현에 기술 이름을 붙임 | `JooqIssueRepository`, `JooqIssueQuery`, `JooqBoardQuery`. 조회 구현은 package-private 클래스(`class JooqIssueQuery implements IssueQuery`)입니다 |
| 조회 포트는 서비스와 같은 피처의 application에, 1:1 | `issue/application/issue/IssueQuery` ↔ `IssueService`, `issue/application/board/BoardQuery` ↔ `BoardService` |
| 조회 포트 안의 전용 행 타입 | `IssueQuery` 안에 `record Filter`·`record Slice`·`record Change`를 중첩합니다 |
| HTTP DTO는 Requests·Views로 묶음 | `IssueRequests`, `IssueViews`(`public final class IssueViews` 안에 `public record …`) |
| 불변 레코드 타입 | Java `record`. 접근자는 `name()` 형식입니다 |
| 없을 수 있는 조회 | `find…`가 `Optional`을 돌려줍니다(`ProjectFacade.findByKey`) |
| 생성자 주입 | Lombok `@RequiredArgsConstructor`와 `final` 필드 |
| 신규 생성과 복원 구분 | 애그리거트의 정적 메서드 `fromPersistence`(예: `Issue.fromPersistence`) |
| 주입한 시계 | `shared/config/TimeConfig`가 `java.time.Clock` 빈을 만들고 서비스가 주입받습니다 |
| 값 객체 | `shared/domain/ValueObject` |

### 트랜잭션

| 지침 | cowork |
| --- | --- |
| 읽기 전용 트랜잭션 | `@Transactional(readOnly = true)` |
| 쓰기 트랜잭션 | `@Transactional` |
| 읽기·쓰기가 함께 있는 서비스는 메서드마다 선언 | `BoardService`·`IssueService`는 클래스에 트랜잭션을 달지 않고 public 메서드마다 위 둘 중 하나를 붙입니다 |
| 명시적 저장 | jOOQ에는 변경 감지가 없으므로 업무 메서드 뒤에 저장소의 `save`를 부릅니다 |

### 오류

| 지침 | cowork |
| --- | --- |
| 도메인의 규칙 위반 예외 | `shared/error/DomainRuleViolation`(메시지만 담은 `RuntimeException`) |
| 서비스의 업무 예외와 모듈 ErrorCode | `shared/error/BusinessException`이 `ErrorCode`를 가집니다. 모듈 코드는 application 루트의 `IssueErrorCode`·`ProjectErrorCode`처럼, 공통 코드는 `CommonErrorCode`에 둡니다 |
| HTTP 경계의 변환 | `shared/web/GlobalExceptionHandler`가 Spring의 `ProblemDetail`을 만들고, `DomainRuleViolation`을 400으로 바꿉니다 |

### 사용자가 올린 HTML과 고른 주소

| 지침 | cowork |
| --- | --- |
| 전용 주소와 서명 | `GET /api/embeds/{token}/{key}`(`HtmlEmbeds.PATH`). `HtmlEmbeds`가 `HmacSHA256`으로 서명하고 용도 문자열 `html-embed`를 넣으며, `MessageDigest.isEqual`로 비교합니다. 만료 1시간(`TTL`), 10분 단위 올림(`STEP`) |
| 응답 | `HtmlEmbedController`가 `CacheControl.maxAge(5분).cachePrivate()`로 답합니다 |
| 그 주소만의 보안 규칙 묶음 | `HtmlEmbedSecurityConfig`가 Spring Security의 `SecurityFilterChain`을 `@Order(0)`, `securityMatcher(HtmlEmbeds.PATH + "/**")`로 두고, `SessionCreationPolicy.STATELESS`, `anyRequest().denyAll()`(GET·HEAD 밖), CSP `sandbox …; frame-ancestors 'self'`, `ReferrerPolicy.NO_REFERRER`를 겁니다 |
| 리다이렉트를 자동으로 따르지 않음 | `HttpPageReader`가 `HttpClient.Redirect.NEVER`로 만들고 `Location`을 직접 풉니다. 시간 제한 5초, 본문 512KB |
| 공개 주소만 부르기 | 대역 판정은 `HttpPageReader`에 있습니다 |
| 결과 기억 | `LinkPreviews`(트랜잭션 서비스가 아닌 `@Component`)가 6시간(`KEPT`), 최대 1000개(`CACHE_SIZE`)를 기억합니다 |

### API 계약

| 지침 | cowork |
| --- | --- |
| API를 바꾸면 OpenAPI·생성 클라이언트 타입·호출자를 같은 변경에서 맞춥니다 | `server/`에서 `./gradlew exportOpenApi`가 `server/openapi.json`을 쓰고, `web/`에서 `npm run api:generate`가 그 파일로 `web/src/shared/api/schema.d.ts`를 만듭니다. 두 파일 모두 저장소에 커밋합니다 |
| 자원 경로와 접두사 | 공개 HTTP 계약은 `/api/v1/` 아래에 둡니다(예: `/api/v1/files`, `/api/v1/notifications`). OpenAPI 문서는 이 경로만 담습니다(`springdoc.paths-to-match=/api/v1/**`). MCP 서버는 `/api/mcp`로 계약 밖에 둡니다 |
| 오류는 `application/problem+json`, 안정된 오류 코드 | `GlobalExceptionHandler`가 `ProblemDetail`을 만들고 `code`(오류 코드)와 `traceId`를 속성으로 싣습니다. 필드 오류는 `errors`에 담습니다. 공통 코드는 `CommonErrorCode`, 모듈 코드는 모듈마다 `IssueErrorCode`처럼 `ErrorCode`를 구현한 열거형에 둡니다 |
| 도메인 규칙 위반은 공통 HTTP 경계에서 400 | 도메인은 `DomainRuleViolation`만 던지고, `GlobalExceptionHandler`가 `COMMON_INVALID_REQUEST`(400)로 바꿉니다 |
| 프레임워크가 직접 답하는 오류도 같은 모양 | MVC 밖에서 답하는 404·405·406·415 등도 `ProblemResponse`가 같은 공통 코드와 문구로 답합니다 |
| 대상 응답에 할 수 있는 일을 싣습니다 | 프로젝트 응답의 `can`은 `ProjectViews.Can(view, edit, manage)`이며, 역할·보관·삭제 상태로 계산합니다. 화면은 이 값으로 버튼을 숨기고, 판정은 서버가 다시 합니다 |
| 목록의 페이지/커서 계약 | 여러 키로 정렬한 목록은 키셋(`Keyset`)으로 읽고, 마지막 행의 정렬 값을 담은 `Cursor`를 돌려줍니다. 다른 정렬의 커서나 읽을 수 없는 커서는 잘못된 요청입니다 |
| 화면의 오류 처리 | 화면은 `web/src/shared/api/http.ts`의 `ApiError`(상태, `code`)로 응답을 받고, `isNotFound`로 404와 읽을 수 없는 주소를 같이 다룹니다 |

### DB와 마이그레이션

| 지침 | cowork |
| --- | --- |
| 공유 환경에 적용된 마이그레이션은 고치지 않고 다음 버전을 추가합니다 | 업무 DB는 `server/src/main/resources/db/migration`의 `V<번호>__<이름>.sql`, 로그 DB는 `db/logs`의 같은 형식 파일입니다. Flyway 기록이 없는 DB를 복원해 올릴 때만 `FLYWAY_BASELINE_ON_MIGRATE=true`로 V1에 표시합니다 |
| 실제 DB 엔진의 트랜잭션·잠금·외래키 동작에 맞춥니다 | 연결마다 `journal_mode=WAL`, `synchronous=NORMAL`, `busy_timeout=5000`, `foreign_keys=true`, `transaction_mode=IMMEDIATE`를 겁니다. 읽기 전용 트랜잭션은 쓰기 잠금을 잡지 않아 읽기끼리, 읽기와 쓰기가 나란히 돕니다. SQLite 오류에는 SQL 상태가 없으므로 `SqliteExceptionTranslator`가 중복 키·무결성 위반·잠금 실패로 나눠, 충돌이 서버 오류로 보이지 않게 합니다 |
| 프로젝트 명령으로 생성 코드를 만들고 손으로 맞추지 않습니다 | jOOQ는 실행 중인 DB 없이 마이그레이션 SQL을 파싱해(`DDLDatabase`) 코드를 만듭니다. 생성물은 `build/generated-sources/jooq`(업무)와 `jooq-logs`(로그)에만 두고 커밋하지 않습니다. `compileJava`가 생성을 먼저 돌리므로 스키마와 코드가 어긋나면 컴파일이 실패합니다 |
| 생성기가 읽지 못하는 구문 | 외래 키, 색인, 처음 넣는 행처럼 jOOQ 파서가 읽지 못하거나 모델에 필요 없는 구문은 마이그레이션 안에서 `-- [jooq ignore start]`와 `-- [jooq ignore stop]` 사이에 둡니다 |
| 절대 시각은 UTC | `timestamptz` 열은 `InstantTextBinding`으로 `Instant`가 되며, SQLite에는 시간 순으로 정렬되는 고정 UTC 문자열로 저장합니다. 사용자가 고른 "그 날 그 시각"은 시간대 없는 `timestamp`로 두어 `LocalDateTime`으로 남깁니다 |
| 빈 DB와 이전 판에서 마이그레이션을 확인합니다 | 테스트는 운영과 같은 SQLite와 마이그레이션으로 돌고(`TestDatabase`가 테스트 사이에 표를 비웁니다), 트랜잭션 동작은 `SqliteTransactionTest`가 확인합니다 |

## 코드 위치

- 기본 패키지: [server/src/main/java/xyz/goraebap/cowork](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork) (`shared`, `module`)
- 모듈 하나의 모양: [module/workspace/issue](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/issue)
- 공개 계약: [ProjectFacade.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/project/ProjectFacade.java), [ProjectSetupSpi.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/project/ProjectSetupSpi.java), [ProjectAccess.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/project/ProjectAccess.java)
- Spi 구현: [BoardSetup.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/application/board/BoardSetup.java)
- 서비스·조회 포트·조회 구현: [BoardService.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/application/board/BoardService.java), [IssueQuery.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/application/issue/IssueQuery.java), [JooqIssueQuery.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/infrastructure/JooqIssueQuery.java)
- 애그리거트와 저장소: [domain/issue](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/domain/issue), [JooqIssueRepository.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/infrastructure/JooqIssueRepository.java)
- 오류: [shared/error](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/error), [GlobalExceptionHandler.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/web/GlobalExceptionHandler.java)
- 시계: [TimeConfig.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/config/TimeConfig.java)
- 올린 HTML: [HtmlEmbeds.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/file/application/HtmlEmbeds.java), [HtmlEmbedController.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/file/application/HtmlEmbedController.java), [HtmlEmbedSecurityConfig.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/file/infrastructure/HtmlEmbedSecurityConfig.java), 테스트 [HtmlEmbedsTest.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/test/java/xyz/goraebap/cowork/module/file/application/HtmlEmbedsTest.java)
- 고른 주소 읽기: [HttpPageReader.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/richbody/infrastructure/HttpPageReader.java), [LinkPreviews.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/richbody/application/LinkPreviews.java), 테스트 [HttpPageReaderTest.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/test/java/xyz/goraebap/cowork/module/projects/richbody/infrastructure/HttpPageReaderTest.java)
- 빌드·검사 설정: [server/build.gradle](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/build.gradle), [server/config](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/config)

- HTTP 계약: [server/openapi.json](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/openapi.json)
- 계약 내보내기 태스크: [server/build.gradle](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/build.gradle)의 `exportOpenApi`, 실제로 쓰는 테스트 [FoundationApiTest.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/test/java/xyz/goraebap/cowork/FoundationApiTest.java)
- 생성 타입: [web/src/shared/api/schema.d.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/api/schema.d.ts)
- 화면의 HTTP 호출: [web/src/shared/api/http.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/api/http.ts)
- 오류 응답: [GlobalExceptionHandler.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/web/GlobalExceptionHandler.java), [ProblemResponse.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/web/ProblemResponse.java), [shared/error](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/error)
- 할 수 있는 일(`can`): [ProjectViews.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/project/application/ProjectViews.java)
- 커서 목록: [Keyset.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/web/Keyset.java), [Cursor.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/web/Cursor.java)
- 오류 계약 테스트: [ApiErrorContractTest.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/test/java/xyz/goraebap/cowork/ApiErrorContractTest.java), [RawHttpErrorContractTest.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/test/java/xyz/goraebap/cowork/RawHttpErrorContractTest.java)

- 업무 DB 마이그레이션: [server/src/main/resources/db/migration](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/resources/db/migration)
- 로그 DB 마이그레이션: [server/src/main/resources/db/logs](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/resources/db/logs), 올리는 코드 [LogDatabase.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/system/infrastructure/LogDatabase.java)
- jOOQ 생성 설정: [server/build.gradle](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/build.gradle)의 `jooq` 블록
- 연결 설정: [server/src/main/resources/application.properties](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/resources/application.properties)
- SQLite 연동: [server/src/main/java/xyz/goraebap/cowork/shared/persistence](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/persistence)(`InstantTextBinding`, `SqliteExceptionTranslator`)
- 트랜잭션 테스트: [SqliteTransactionTest.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/test/java/xyz/goraebap/cowork/SqliteTransactionTest.java)

## 지침과 다르게 정한 것

- 모듈 간 계약의 전용 타입을 Facade 안 `Param`·`Result` 묶음에 두지 않습니다. `ProjectFacade`는 모듈 루트의 공개 값(`ProjectSummary`·`NewProject`)을 쓰고, `FileFacade`는 인터페이스 안에 `record OpenedFile`을 바로 중첩합니다.
- 읽기 전용 서비스가 따로 남은 곳이 있습니다: `document/application/box/BoxQueryService`.

## 작업 절차

서버 코드를 바꾸면 `server/`에서 `./gradlew test integrationTest`를 실행합니다. `test`는 `integration` 태그를 뺀 테스트, `integrationTest`는 그 태그의 테스트입니다. 포맷·규칙·결함 검사(Spotless·Checkstyle·SpotBugs)는 Gradle의 `check`에 걸립니다.

API를 바꾼 뒤 계약과 생성 타입을 다시 만듭니다.

```bash
cd server && ./gradlew exportOpenApi
cd ../web && npm run api:generate
```

스키마를 바꾼 뒤 `server/`에서 생성 코드를 다시 만들고 검사합니다. 생성은 컴파일 전에 자동으로 돌며, 따로 돌릴 때는 `jooqCodegen`을 씁니다.

```bash
cd server && ./gradlew jooqCodegen
./gradlew test integrationTest
```

---
arc42: "8.2, 5, 2"
---

# cowork: 백엔드

cowork는 프로젝트·업무·문서를 다루는 설치형 작업 공간입니다. 이 파일은 [백엔드 지침](../../../backend/SKILL.md)을 cowork 서버(`server/`)에 적용한 모양을 담습니다.

## 스택과 고른 이유

- Java 21, Spring Boot 4.1.1, jOOQ 3.21.6, Flyway, SQLite(`sqlite-jdbc`), Lombok입니다. 빌드는 Gradle입니다.
- jOOQ 코드는 실행 중인 DB 없이 마이그레이션 SQL에서 만듭니다(`DDLDatabase`). 빌드가 외부 상태에 기대지 않고, 스키마와 코드가 어긋나면 컴파일이 실패합니다. 생성물은 `build/` 아래에만 두고 커밋하지 않습니다.
- 코드 검사는 세 도구가 나눠 맡습니다. 포맷은 Spotless(palantir-java-format), 이름·모양 규칙은 Checkstyle, 결함 패턴은 SpotBugs입니다. 생성 코드는 셋 모두에서 뺍니다.

## 지침을 어떻게 적용했나

### 모듈과 계층

| 지침 | cowork |
| --- | --- |
| 모듈형 모놀리스, 모듈은 단수 이름 | 기본 패키지 `xyz.goraebap.cowork` 아래를 기술 기반 `shared`와 업무 모듈 `module`로 나눕니다. 모듈은 `user`·`file`·`notification`·`system`·`seed`·`realtime`·`search`·`mcp`와 `workspace`(`project`·`issue`·`document`·`richbody`·`activity`)입니다 |
| 모듈 안을 application·domain·infrastructure로 | 예: `module/workspace/issue/application`, `…/issue/domain`, `…/issue/infrastructure`. application과 domain은 피처·애그리거트별 하위 패키지(`board`·`cycle`·`issue`·`label` …)로 나눕니다 |
| 모듈 루트의 Facade·Spi·Event가 공개 계약 | `ProjectFacade`·`ProjectSetupSpi`·`ProjectAccess`와 공개 값 `ProjectSummary`·`NewProject`·`ProjectRole`이 `module/workspace/project` 루트에 있습니다. 사건은 `ActivityEvent`처럼 둡니다 |
| Facade 구현은 선언 모듈의 application에 | `ProjectFacade`는 `project/application/ProjectService`가 구현합니다 |
| Spi는 선언 모듈 밖에서 구현 | `ProjectSetupSpi`(프로젝트를 만든 트랜잭션 안에서 알림)를 issue 모듈의 `BoardSetup`·`SavedViewSetup`이 구현해 보드·저장한 보기를 함께 만듭니다 |
| 접근 판정자 하나 | `ProjectAccess`(모듈 루트의 인터페이스)를 `ProjectAccessService`가 구현합니다. 이슈·문서·주기·보드·검색·에이전트 도구가 모두 여기에 묻습니다 |

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

## 지침과 다르게 정한 것

- 모듈 간 계약의 전용 타입을 Facade 안 `Param`·`Result` 묶음에 두지 않습니다. `ProjectFacade`는 모듈 루트의 공개 값(`ProjectSummary`·`NewProject`)을 쓰고, `FileFacade`는 인터페이스 안에 `record OpenedFile`을 바로 중첩합니다.
- 읽기 전용 서비스가 따로 남은 곳이 있습니다: `document/application/box/BoxQueryService`.

## 작업 절차

서버 코드를 바꾸면 `server/`에서 `./gradlew test integrationTest`를 실행합니다. `test`는 `integration` 태그를 뺀 테스트, `integrationTest`는 그 태그의 테스트입니다. 포맷·규칙·결함 검사(Spotless·Checkstyle·SpotBugs)는 Gradle의 `check`에 걸립니다.

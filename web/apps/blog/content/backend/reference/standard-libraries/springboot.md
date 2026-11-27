---
title: 표준 라이브러리 (Spring Boot)
summary: 표준 지정 영역에 대응하는 Spring Boot 채택 도구 목록입니다.
---

## 런타임과 빌드

| 영역 | 채택 도구 | 비고 |
| --- | --- | --- |
| 언어 | Java 21 | Gradle toolchain으로 버전 고정 |
| 프레임워크 | Spring Boot 4.x | `io.spring.dependency-management` 사용 |
| 빌드 도구 | Gradle (Groovy DSL) | `gradlew` 래퍼 기준 |

## 애플리케이션 라이브러리

| 영역 | 채택 라이브러리 | 역할 |
| --- | --- | --- |
| 웹 API | `spring-boot-starter-webmvc` | REST API 서블릿 스택 |
| 인증·인가 | `spring-boot-starter-security` | 보안 필터 체인, 메서드 권한 제어 |
| 입력 검증 | `spring-boot-starter-validation` | 요청 DTO Bean Validation |
| 데이터 접근 | `spring-boot-starter-jooq`, `jooq-codegen-gradle` | SQL 빌더 및 스키마 기반 코드 생성 |
| 스키마 마이그레이션 | `spring-boot-starter-flyway` | 버전 관리 SQL 마이그레이션 |
| API 명세 | `springdoc-openapi-starter-webmvc-api` | OpenAPI JSON 생성 (`/api/openapi`) |
| 실시간 통신 *(선택)* | `spring-boot-starter-websocket` | WebSocket 연동 |
| 메일 발송 *(선택)* | `spring-boot-starter-mail` | SMTP 메일 발송 |
| 오브젝트 스토리지 *(선택)* | `software.amazon.awssdk:s3` | S3 호환 스토리지 및 사전 서명 URL |
| 보일러플레이트 축소 | `org.projectlombok:lombok` | `compileOnly` + `annotationProcessor` |

- DB 드라이버는 대상 DB에 맞춰 추가합니다. 경량 단일 파일 DB가 필요할 때는 `org.xerial:sqlite-jdbc`를 사용합니다.
- jOOQ 런타임 버전과 `jooq-codegen-gradle` 플러그인 버전은 항상 동일하게 맞춥니다.
- JPA/Hibernate와 MyBatis는 혼용하지 않습니다. 데이터 접근은 jOOQ로 일원화합니다.

## 코드 품질과 테스트

| 영역 | 채택 도구 | 역할 |
| --- | --- | --- |
| 코드 포맷 | Spotless (`palantirJavaFormat`) | 자동 포맷, 미사용 import 제거, 어노테이션 정렬 |
| 컨벤션 검사 | Checkstyle | 코드 규칙 검사 (`maxWarnings = 0`) |
| 정적 결함 분석 | SpotBugs | 바이트코드 기반 잠재 결함 탐지 |
| 단위·웹 테스트 | JUnit 5, AssertJ, `spring-boot-starter-webmvc-test`, `spring-security-test` | 컨트롤러·보안·도메인 테스트 |

- `build/generated-sources/` 아래 생성 코드는 Spotless, Checkstyle, SpotBugs 검사에서 제외합니다.
- 통합 테스트에는 `@Tag("integration")`을 붙여 `test`와 `integrationTest` 태스크로 분리합니다.

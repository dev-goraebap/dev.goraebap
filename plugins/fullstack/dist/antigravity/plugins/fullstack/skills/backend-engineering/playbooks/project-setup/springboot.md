# 프로젝트 구성 (Spring Boot)

라이브러리 목록은 [표준 라이브러리](../../reference/standard-libraries/springboot.md), 패키지 배치는 [디렉토리·패키지 구조](../../reference/directory-structure/springboot.md)를 기준으로 삼습니다.

## 1. 프로젝트 초기화

`settings.gradle`에 프로젝트 이름을 지정하고, `build.gradle`에 Java 21 툴체인과 기본 플러그인을 등록합니다.

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '4.1.1'
    id 'io.spring.dependency-management' version '1.1.7'
    id 'checkstyle'
    id 'com.diffplug.spotless' version '8.8.0'
    id 'com.github.spotbugs' version '6.5.9'
    id 'org.jooq.jooq-codegen-gradle' version '3.21.6'
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}
```

배포 이미지가 버전에 상관없이 같은 파일을 복사할 수 있도록 `bootJar` 파일 이름을 고정합니다.

```groovy
tasks.named('bootJar') {
    archiveFileName = 'app.jar'
}
```

## 2. 표준 의존성 추가

[표준 라이브러리](../../reference/standard-libraries/springboot.md)에 따라 웹, 보안, 검증, 마이그레이션, 데이터 접근, OpenAPI, 테스트 의존성을 추가합니다.

- jOOQ 런타임 버전(`ext['jooq.version']`)은 `jooq-codegen-gradle` 플러그인 버전과 맞춥니다.
- 테스트 의존성으로 `spring-boot-starter-webmvc-test`, `spring-security-test`, `junit-platform-launcher`를 등록합니다.

## 3. 마이그레이션과 jOOQ 코드 생성 연결

DB를 띄우지 않고도 빌드 시점에 타입 안전한 쿼리 코드를 생성하도록 설정합니다.

1. `src/main/resources/db/migration/V1__schema.sql` 파일을 만듭니다.
2. `build.gradle`의 `jooq` 블록에서 `DDLDatabase`가 `src/main/resources/db/migration/*.sql`을 읽어 `build/generated-sources/jooq` 아래에 코드를 생성하게 설정합니다.
3. 생성 디렉토리를 `sourceSets.main.java`에 포함하고, `compileJava`가 `jooqCodegen`에 의존하도록 연결합니다.

```groovy
sourceSets {
    main {
        java {
            srcDir layout.buildDirectory.dir('generated-sources/jooq')
        }
    }
}

tasks.named('compileJava') {
    dependsOn tasks.named('jooqCodegen')
}
```

## 4. 코드 품질 도구 설정

포맷·컨벤션·정적 분석 규칙 파일을 두고 Gradle에 연결합니다. 생성된 jOOQ 코드는 검사 대상에서 제외합니다.

1. `build.gradle`에 Spotless(`palantirJavaFormat`, `removeUnusedImports`, `formatAnnotations`)를 설정합니다.
2. `config/checkstyle/checkstyle.xml`과 `suppressions.xml`을 두고 `checkstyle.maxWarnings = 0`으로 설정합니다.
3. `config/spotbugs/exclude.xml`을 두고 SpotBugs에 연결합니다.

## 5. 환경 설정과 프로필 분리

기본 설정은 `src/main/resources/application.properties`에 두고, 로컬 개발 전용 덮어쓰기만 `application-dev.properties`에 둡니다.

1. `application.properties` 맨 위에 선택적 `.env` 로드를 추가합니다.
   ```properties
   spring.config.import=optional:file:./.env[.properties]
   server.port=${SERVER_PORT:8080}
   ```
2. 환경마다 달라지는 값(DB 경로/주소, CORS 허용 출처, 메일·스토리지 접속 정보 등)은 `${ENV_VAR:기본값}` 형태로 바인딩합니다.
3. `application-dev.properties`에는 로컬 전용 설정(`server.address=127.0.0.1`, `app.auth.cookie-secure=false`, 로컬 프론트엔드 origin 등)을 둡니다.
4. 변경 가능한 환경변수 목록을 정리한 `.env.example`을 루트에 두고, 실제 `.env`와 로컬 데이터 폴더(`data/`)는 `.gitignore`에 추가합니다.

## 6. 기본 패키지와 경계 테스트 작성

1. [디렉토리·패키지 구조](../../reference/directory-structure/springboot.md)에 맞춰 `shared/`(공통 예외 처리, 웹 설정, 영속성 설정, `/health` 엔드포인트)와 첫 컨텍스트 패키지를 만듭니다.
2. `src/test/java/<base-package>/ArchitectureTest.java`를 추가해 패키지·레이어 간 금지된 `import`를 단위 테스트에서 검사합니다.
3. `build.gradle`에서 `@Tag("integration")` 테스트를 `integrationTest` 태스크로 분리하고 `check` 태스크가 이를 포함하게 설정합니다.

```groovy
tasks.named('test') {
    useJUnitPlatform { excludeTags 'integration' }
}

tasks.register('integrationTest', Test) {
    useJUnitPlatform { includeTags 'integration' }
    shouldRunAfter tasks.named('test')
}

tasks.named('check') {
    dependsOn tasks.named('integrationTest')
}
```

## 7. 동작 확인

아래 순서로 실행해 빌드·검사·기동이 모두 통과하는지 확인합니다.

```bash
./gradlew spotlessCheck check
./gradlew bootRun --args='--spring.profiles.active=dev'
```

서버가 뜨면 `GET /api/v1/health` 응답과 `GET /api/openapi` 스펙 노출을 확인합니다.

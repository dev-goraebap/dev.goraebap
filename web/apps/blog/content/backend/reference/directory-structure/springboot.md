---
title: 디렉토리·패키지 구조 (Spring Boot)
summary: 공통 구조 기준을 Gradle · Spring Boot 프로젝트에 적용한 디렉토리와 Java 패키지 배치입니다.
---

## 프로젝트 최상위 디렉토리

```tree
server/
  config/
    checkstyle/             # checkstyle.xml, suppressions.xml
    spotbugs/               # exclude.xml
  src/
    main/
      java/<base-package>/  # 애플리케이션 소스
      resources/
        db/migration/       # Flyway 마이그레이션 SQL (V1__*.sql)
        application.properties
        application-dev.properties
    test/
      java/<base-package>/  # 테스트 및 ArchitectureTest
      resources/
        application-test.properties
  .env.example              # 환경변수 예시 (실제 .env는 커밋 금지)
  build.gradle
  settings.gradle
  lombok.config
```

- jOOQ 생성 코드는 `build/generated-sources/jooq/`에만 두고 Git에 커밋하지 않습니다.

## Java 패키지 구조

```tree
<base-package>/
  ServerApplication.java
  shared/
    config/
    domain/
    error/
    persistence/
    storage/
    web/
  <context>/                # 예: user, order, file 등 프로젝트 컨텍스트
    *Facade.java
    <PublicDto/Enum>.java
    application/            # 기능이 많아지면 <feature>/ 하위 패키지로 분리, 공통은 루트에 배치
      *Controller.java
      *Service.java
      *Query.java
      *Requests.java
      *Views.java
      *ErrorCode.java
    domain/                 # 애그리거트가 많아지면 <aggregate>/ 하위 패키지로 분리, 공통은 루트에 배치
      <aggregate>/
        <Entity>.java
        <ValueObject>.java
        *Repository.java
    infrastructure/
      Jooq*Repository.java
      Jooq*Query.java
      *Config.java
```

- 여러 제품 영역을 한 서버에서 다루어 공통 업무 묶음과 제품 업무 묶음을 분리해야 할 때는 `<base-package>/<group>/<context>/` 형태로 한 단계 묶고, 하위 그룹 간 의존 방향을 `ArchitectureTest`에 추가합니다.

## 경계 검사 (`ArchitectureTest`)

의존성 경계 규칙은 `src/test/java/<base-package>/ArchitectureTest.java`에서 Java 소스의 `import` 문을 스캔해 검증합니다.

| 검사 항목 | Spring Boot 기준 금지 import |
| --- | --- |
| `shared` 독립성 | `<base-package>.*` 중 `shared`, `jooq`를 제외한 모든 컨텍스트 패키지 |
| 컨텍스트 캡슐화 | 다른 컨텍스트의 `.application.`, `.domain.`, `.infrastructure.` 패키지 |
| `domain` 순수성 | `.application.`, `.infrastructure.`, `org.springframework.*`, `org.jooq.*`, `<base-package>.jooq.*` |

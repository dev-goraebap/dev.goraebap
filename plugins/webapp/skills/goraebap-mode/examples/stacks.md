# 스택 id와 전제

프로젝트 AGENTS.md의 `Webapp 스택:` 줄에 쓰는 스택 id와, 그 id의 예시가 전제하는 라이브러리입니다. 예시는 아래 판의 코드에서 발췌했으므로, 프로젝트가 같은 id라도 라우터·조회 도구·컴포넌트 라이브러리가 다르면 예시의 호출을 그대로 옮기지 않고 규칙만 따릅니다([예시 읽기](../references/examples.md)).

## react

출처: [web/package.json](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/package.json)

```json
    "@base-ui/react": "1.9.0",
    "@tanstack/react-query": "^5.102.8",
    "@tanstack/react-router": "^1.170.32",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "shadcn": "^4.23.0",
    "tailwindcss": "4.3.5",
    "typescript": "6.0.2",
    "vite": "8.1.5"
```

React 19 화면을 TanStack Router의 파일 라우팅과 TanStack Query로 짜고, 컴포넌트는 shadcn/ui(Base UI)를 받아 소유하며 Tailwind CSS 4로 칠합니다. Next.js나 다른 라우터·상태 도구를 쓰는 React 프로젝트는 규칙은 같지만 예시의 라우터·조회 API는 맞지 않습니다.

## spring

출처: [server/build.gradle](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/build.gradle)

```groovy
plugins {
	id 'java'
	id 'org.springframework.boot' version '4.1.1'
	id 'io.spring.dependency-management' version '1.1.7'
	// …
	id 'org.jooq.jooq-codegen-gradle' version '3.21.6'
}
// …
java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
// …
    implementation 'org.springframework.boot:spring-boot-starter-flyway'
    implementation 'org.springframework.boot:spring-boot-starter-jooq'
    // …
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-api:3.1.1'
    // …
    implementation 'org.xerial:sqlite-jdbc'
```

Java 21과 Spring Boot 4 MVC 서버에서 Flyway 마이그레이션 SQL로 스키마를 바꾸고 jOOQ로 쿼리 코드를 생성합니다. JPA나 다른 영속성 도구를 쓰는 Spring 프로젝트는 계층·계약 규칙은 같지만 저장소·조회 구현 예시는 맞지 않습니다.

## angular

출처: [web/pnpm-workspace.yaml](https://github.com/dev-goraebap/dev.goraebap/blob/9ab5efcb944c053f149d5f6cb5e12d1359ef9c7a/web/pnpm-workspace.yaml)

```yaml
  "@angular/aria": "^22.3.0"
  "@angular/build": "^22.3.0"
  "@angular/cdk": "^22.3.0"
  # …
  "@angular/core": "^22.3.0"
  # …
  "@angular/router": "^22.3.0"
  # …
  typescript: "^6.0.2"
  # …
  tailwindcss: "^4.3.5"
  # …
  tailwind-variants: "^4.0.2"
```

Angular 22 화면을 Angular CLI 빌드와 설정 방식의 라우터로 짜고, 서버 데이터는 시그널로 만든 작은 캐시로 다룹니다. 화면 부품은 같은 스타일 레시피에 동작을 Angular Aria(메뉴 등)와 Angular CDK(대화상자)로 입힌 어댑터입니다. NgRx나 TanStack Query로 서버 데이터를 다루는 Angular 프로젝트는 규칙은 같지만 캐시 예시는 맞지 않습니다.

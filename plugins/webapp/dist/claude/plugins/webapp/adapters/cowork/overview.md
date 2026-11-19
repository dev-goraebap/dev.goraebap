---
arc42: "none"
---

# cowork: 개요

[cowork](https://github.com/dev-goraebap/cowork)는 프로젝트·업무·문서를 다루는 설치형 작업 공간이며, Webapp 지침을 적용한 예제 프로젝트입니다. 이 파일은 저장소 전체의 모양과 실행 방법을 담고, 영역별 적용은 같은 폴더의 영역 파일에 있습니다. 예제를 읽는 법은 [예제](../README.md)를 따릅니다.

## 스택과 고른 이유

| 쪽 | 스택 | 버전(고정 커밋 기준) |
| --- | --- | --- |
| 서버 | Java, Spring Boot, jOOQ, Flyway, SQLite(`sqlite-jdbc`), springdoc-openapi | Java 21, Spring Boot 4.1.1, jOOQ 3.21.6, springdoc 3.1.1 |
| 화면 | React, TypeScript, Vite, TanStack Router·Query, shadcn/ui(Base UI), Tailwind CSS v4 | React 19.2.8, TypeScript 6.0.2, Vite 8.1.5, Tailwind CSS 4.3.5 |
| 배포 | 서버와 빌드한 화면을 담은 컨테이너 이미지 하나 | Node.js 24(화면 빌드), JRE 21(실행) |

버전은 [server/build.gradle](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/build.gradle), [web/package.json](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/package.json), [Dockerfile](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/Dockerfile)에서 확인합니다. 설치형 제품이라 DB를 파일 하나(SQLite)로 두어 별도 DB 서버 없이 띄웁니다.

## 저장소 모양

| 경로 | 내용 |
| --- | --- |
| `server/` | API 서버. 기본 패키지 `xyz.goraebap.cowork`, 기술 기반 `shared`와 업무 모듈 `module` |
| `web/` | 화면. FSD 층(`app`·`pages`·`features`·`entities`·`shared`)으로 나눕니다 |
| `AGENTS.md` | 구성, Webapp 연결, 프로젝트 규칙, 실행과 검증 |
| `Dockerfile` | 화면 빌드·서버 빌드·실행 단계를 나눈 이미지 하나 |
| `dev.sh` | 로컬에서 서버와 화면을 함께 띄우는 스크립트 |

## 무엇이 어디 있는가

| 찾는 것 | cowork 경로 |
| --- | --- |
| 화면 라우트 | [web/src/pages](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/pages)(`route.tsx`·`page.tsx`) |
| 앱 셸 | [web/src/app/layout](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/layout) |
| 키트 | [web/src/shared/ui/kit](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit) |
| 제품 공용 컴포넌트 | [web/src/shared/ui](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui) |
| 데이터 준비 | [web/src/shared/lib/prepare.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib/prepare.ts) |
| 화면 규칙 검사 | [web/scripts/check-ui.mjs](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/scripts/check-ui.mjs) |
| API 생성 타입 | [web/src/shared/api/schema.d.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/api/schema.d.ts) |
| 서버 모듈 | [server/src/main/java/xyz/goraebap/cowork/module](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module) |
| 서버 기술 기반 | [server/src/main/java/xyz/goraebap/cowork/shared](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared) |
| 마이그레이션 | [server/src/main/resources/db/migration](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/resources/db/migration) |
| HTTP 계약 | [server/openapi.json](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/openapi.json) |
| 실행·검사 명령 | [AGENTS.md](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/AGENTS.md)의 "실행과 검증" |

MCP 서버(`module/mcp`), 문서 편집기, 저장소 연동처럼 cowork에만 있는 기능은 일반 규칙의 견본이 아닙니다.

## 실행과 검사

| 할 일 | 명령 |
| --- | --- |
| 서버와 화면을 함께 띄우기 | 저장소 루트에서 `sh dev.sh`(서버 8080, 화면 4420). 한쪽만은 `sh dev.sh server`, `sh dev.sh web` |
| 화면 의존성 받기 | `web/`에서 `npm ci`(`dev.sh`보다 먼저) |
| 서버 검사 | `server/`에서 `./gradlew test integrationTest` |
| 화면 검사 | `web/`에서 `npm run check` |

로컬 DB와 파일은 `server/data/`에 생깁니다. 메일 서버가 없으면 로그인 인증 코드는 서버 로그에 찍힙니다.

## 지침과 다르게 정한 것

cowork AGENTS.md의 프로젝트 규칙 표에는 한 줄이 있습니다. 입력 칸·글 칸·본문 편집기의 플레이스홀더은 지우지 않고, 지시형 문장만 짧은 이름으로 바꿉니다. 테두리 없는 본문 편집기는 플레이스홀더가 칸을 알리는 유일한 표시이기 때문입니다.

## 작업 절차

1. 파일 하나는 영역 파일이나 위 표의 링크를 열어 읽습니다.
2. 여러 파일을 함께 볼 때는 작업 기록 위치의 임시 폴더에 얕게 받습니다.

   ```bash
   git clone --depth 1 https://github.com/dev-goraebap/cowork.git <임시 폴더>
   ```

3. 링크와 같은 판을 보려면 받은 폴더에서 고정 커밋으로 맞춥니다.

   ```bash
   git -C <임시 폴더> fetch --depth 1 origin 570d27da402451fe2ca06fca74862dd3899555c9
   git -C <임시 폴더> checkout 570d27da402451fe2ca06fca74862dd3899555c9
   ```

4. 받은 저장소는 읽기만 합니다. 고치거나 지금 프로젝트에서 import하지 않습니다.

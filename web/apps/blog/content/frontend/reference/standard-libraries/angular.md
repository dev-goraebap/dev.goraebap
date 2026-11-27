---
title: 표준 라이브러리 (Angular)
summary: Angular 프론트엔드 앱에서 영역별로 채택하는 표준 도구와 라이브러리입니다.
---

공통 도입 원칙은 [표준 라이브러리](./index.md)를 따릅니다.

## 표준 라이브러리 목록

| 구분 | 영역 | 채택 도구 | 비고 |
| --- | --- | --- | --- |
| 기반 | 패키지 · 런타임 | pnpm · Node.js · TypeScript (`strict`) | `strictTemplates` 활성화 |
| 기반 | 빌드 · CLI | Angular CLI (`@angular/build`) | Standalone 기반 빌드 |
| 핵심 | 라우팅 | Angular Router (`@angular/router`) | `routes.ts` + `loadChildren`, `withComponentInputBinding()`, `withViewTransitions()` |
| 핵심 | 서버 상태 · HTTP | `HttpClient` (`withFetch()`) + Signals 기반 서버 상태 캐시 | 조회 옵션 공유, 캐시 우선 표시·무효화 |
| 핵심 | 스타일 · UI | Tailwind CSS v4 (`@tailwindcss/postcss`), `tailwind-variants`, Angular CDK · Angular Aria · Spartan | 디자인 시스템 레시피 + Angular 어댑터 |
| 선택 | 폼 | `@angular/forms` (Reactive Forms / Signal 기반 폼) | 화면 복잡도에 따라 선택 |
| 품질 | 포맷 · 린트 | Prettier (`prettier-plugin-tailwindcss`), ESLint (`typescript-eslint`) | 경고 없이 통과 기준 |
| 품질 | 미사용 코드 · 타입 | Knip, `tsc -p tsconfig.app.json --noEmit` | 템플릿·타입 오류 사전 검출 |

## 적용 기준

- 모든 컴포넌트·지시자·파이프는 Standalone으로 작성하고 `NgModule`을 새로 만들지 않습니다.
- 반응형 상태는 Signals(`signal`, `computed`, `effect`)를 기본으로 두고, 스트림 조합이 필요한 비동기 흐름에만 RxJS를 씁니다.
- `provideHttpClient(withFetch())`와 `provideRouter(..., withComponentInputBinding())`를 앱 루트 설정(`app.config.ts`)에 기본 등록합니다.

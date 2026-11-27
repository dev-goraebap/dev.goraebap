---
title: 표준 라이브러리 (React · TanStack)
summary: React 프론트엔드 앱에서 영역별로 채택하는 표준 도구와 라이브러리입니다.
---

공통 도입 원칙은 [표준 라이브러리](./index.md)를 따릅니다.

## 표준 라이브러리 목록

| 구분 | 영역 | 채택 도구 | 비고 |
| --- | --- | --- | --- |
| 기반 | 패키지 · 런타임 | pnpm · Node.js · TypeScript (`strict`) | 워크스페이스 카탈로그로 버전 정렬 |
| 기반 | 빌드 · 개발 서버 | Vite (`@vitejs/plugin-react`) | 빠른 HMR과 ESM 번들링 |
| 핵심 | 라우팅 | TanStack Router (`@tanstack/react-router`, `@tanstack/router-plugin`) | `src/pages` 파일 기반 라우팅·자동 코드 분할 |
| 핵심 | 서버 상태 · HTTP | TanStack Query + `fetch` 래퍼 | 조회 옵션 공유, 캐시 우선 표시·무효화 |
| 핵심 | 스타일 · UI | Tailwind CSS v4 (`@tailwindcss/vite`), `tailwind-variants`, Base UI (`@base-ui/react`) | 디자인 시스템 레시피 + React 어댑터 |
| 선택 | 아이콘 | Lucide (`lucide-react`) / Solar 아이콘 어댑터 | 디자인 시스템 아이콘 규격 따름 |
| 품질 | 포맷 · 린트 | Prettier (`prettier-plugin-tailwindcss`), ESLint (`typescript-eslint`, `eslint-plugin-react-hooks`) | 경고 없이 통과 기준 |
| 품질 | 미사용 코드 · 타입 | Knip, `tsc --noEmit` | 죽은 파일·export·의존성 검출 |

## 적용 기준

- 서버 데이터를 전역 클라이언트 스토어에 복제하지 않고 서버 상태 캐시(TanStack Query)가 소유합니다.
- UI 스타일 조합은 `tailwind-variants` 레시피와 디자인 시스템 토큰을 우선 사용합니다.
- 자동 생성되는 `src/app/router/routeTree.gen.ts`는 ESLint·Prettier·Knip 검사에서 제외합니다.

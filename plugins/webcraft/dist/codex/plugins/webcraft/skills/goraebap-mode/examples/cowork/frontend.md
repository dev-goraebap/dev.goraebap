---
arc42: "8.4, 2"
---

# cowork: 프론트엔드

cowork는 프로젝트·업무·문서를 다루는 설치형 작업 공간입니다. 이 파일은 [프론트엔드 지침](../../../frontend/SKILL.md)을 cowork 화면(`web/`)에 적용한 모양을 담습니다.

## 스택과 고른 이유

- React 19.2, TypeScript 6.0, Vite 8.1입니다.
- 라우터는 TanStack Router 1.170(파일 라우팅은 `@tanstack/router-plugin`), 서버 데이터 캐시는 TanStack Query 5.102입니다. 라우터가 URL의 검색 조건을 검증하고 라우트 loader에서 Query 캐시를 채우므로, 지침의 "URL은 라우터, 서버 데이터는 조회 도구" 소유 구분을 두 라이브러리가 그대로 나눠 맡습니다.
- HTTP 타입은 서버의 OpenAPI 문서에서 openapi-typescript로 만듭니다([cowork: API](api.md)).
- 폴더 구조는 FSD입니다.

## 지침을 어떻게 적용했나

### 코드 작성과 화면 계층

| 지침 | cowork |
| --- | --- |
| FSD 다섯 층, widgets 없음 | `web/src/app`·`pages`·`features`·`entities`·`shared` |
| `pages`는 주소, 폴더 하나가 주소 하나 | TanStack Router 파일 라우팅이 `src/pages`를 읽습니다(`vite.config.ts`의 `routesDirectory: './src/pages'`, 만든 트리는 `src/app/router/routeTree.gen.ts`) |
| 부모 경로 파일과 화면 파일 | `route.tsx`는 그 폴더 아래 주소들의 틀(레이아웃·권한 확인·데이터 준비), `page.tsx`는 그 주소의 화면입니다(`indexToken: 'page'`) |
| 주소에 나타나지 않는 묶음 폴더 | `_`로 시작하는 폴더. 로그인한 사람의 화면은 `src/pages/_app` 아래에 둡니다 |
| 세그먼트와 공개 진입점은 라우트가 아님 | `routeFileIgnorePattern: '^(ui|api|model|lib|config|index\\.ts)$'` |
| 공간마다 `pages` 아래 폴더 | `_app` 아래에 영역별 폴더를 둡니다: `workspace`, `instance`, `account`, `inbox`, `my-work`, `search` |
| 형제 주소를 가져오지 않음, 화면 규칙 검사 | `web/scripts/check-ui.mjs`(`npm run lint:ui`)가 층의 방향, 같은 층의 다른 슬라이스, `pages`의 형제 주소 가져오기를 막습니다 |
| 키트와 제품 공용 부품을 나눔 | 키트 `web/src/shared/ui/kit`, 제품 공용 부품 `web/src/shared/ui` |
| 업무를 모르는 레이아웃은 키트 안 | `web/src/shared/ui/kit/layout`(`app-shell`·`page`·`pane-frame`·`phone-tools`·`split-view`) |
| 업무를 아는 앱 셸은 `app` 층 | `web/src/app/layout`(`AppShellLayout`·`PanelHost`·`RouteStage` …) |
| 파일 이름 | 컴포넌트는 `RolesPage.tsx`처럼 PascalCase, 훅 파일은 `use-intent-preload.ts`처럼 kebab-case, 경로 별칭은 `@/` → `src/` |
| 메모이제이션·이중 실행 검사 | React의 `useMemo`·`useCallback`, `StrictMode` |

### 상태와 데이터 흐름

| 지침 | cowork |
| --- | --- |
| 서버 데이터 캐시 도구 | TanStack Query. 앱의 클라이언트는 `src/app/model/query-client.ts` 하나이며 `staleTime: 30_000`, 읽기 실패는 5xx·네트워크 오류일 때 한 번 다시 하고, 변경은 다시 하지 않습니다(`mutations: { retry: false }`) |
| 요청·캐시 키·조회 옵션을 슬라이스 api에 | 각 슬라이스 `api/`에 `queryOptions()`로 만든 옵션을 둡니다 |
| 사용 중단 API를 쓰지 않음 | TanStack Query 5.102에서 `ensureQueryData`·`fetchQuery`·`prefetchQuery`가 사용 중단이므로 `queryClient.query()`·`infiniteQuery()`를 쓰고, 최신 응답을 기다려야 하면 `staleTime`을 명시합니다 |
| 꼭 있어야 하는 것과 있으면 좋은 것을 나눈 준비 함수 | `web/src/shared/lib/prepare.ts`의 `prepare(client, id, run)`. `run`이 받는 `prep`의 `ensure`·`ensureInfinite`는 실패하면 준비를 멈추고, `prime`·`primeInfinite`는 실패를 삼킵니다. 내부에서 `client.query()`·`client.infiniteQuery()`를 `staleTime: 'static'`으로 부르므로 캐시가 있으면 기다리지 않습니다. 라우트 loader와 대화상자(`PanelHost`)가 같은 함수를 씁니다 |

### 화면 전환

| 지침 | cowork |
| --- | --- |
| 링크에 포인터·초점이 오면 미리 준비 | `web/src/app/layout/use-intent-preload.ts`의 `useIntentPreload()`를 `AppShellLayout`에서 한 번 겁니다. `pointerover`·`focusin`에서 `router.preloadRoute()`를 부르고 같은 주소는 10초(`AGAIN_MS`)에 한 번입니다. 라우터도 `defaultPreload: 'intent'`입니다 |
| 다음 화면이 준비될 때까지 지금 화면 유지, 150ms 뒤 진행 표시 | `createRouter`의 `defaultPendingMs: Infinity`, 진행 표시는 `RouteStage`(`SHOW_AFTER_MS = 150`) |
| 라우터의 준비 결과 기억과 캐시 수명을 따로 | 라우터 `defaultGcTime: 0`, `defaultPreloadStaleTime: 0`이고 데이터는 Query 캐시가 들고 있습니다 |
| 미리 받는 함수를 가진 지연 로딩 래퍼 | `web/src/shared/lib/preloadable.tsx`의 `preloadable()`이 `React.lazy` 위에 `preload()`를 붙입니다. 본문 칸은 `RichBody.preload()`이며 `prepare`의 `body()`가 데이터와 함께 부릅니다 |
| 이동 중인 주소로 메뉴 계산 | `resolvedLocation`이 아니라 `location`. `web/src/shared/lib/route-location.ts` |
| 쓰던 칸을 떠날 때 묻기 | TanStack Router `useBlocker`(예: `shared/ui/kit/compose/ComposeSurface.tsx`) |
| 목록 위 대화상자(마스킹) | `web/src/shared/lib/panel.ts`가 목록 주소에 `?panel=<페이지 주소>`를 달고 주소창에는 라우터의 `mask`로 그 페이지 주소를 보입니다. 라우터에 `unmaskOnReload: true`를 둬 새로고침·복사한 주소는 그 페이지로 엽니다. 휴대폰에서는 늘 페이지로 갑니다 |
| 키트 부품의 링크를 라우터 이동에 연결 | `render={<Link … />}`, 줄 전체를 여는 링크는 `RowLink`(`createLink`로 만든 키트 부품, `web/src/shared/ui/kit/row-link.tsx`) |
| 본문의 앱 링크를 라우터 이동으로 | `RichBody`의 `followInside`가 본문 칸의 누르기를 받아 이 앱의 화면 주소만 라우터로 엽니다. 파일 받기(`download`)와 `/api/` 주소는 브라우저에 맡깁니다 |

## 코드 위치

- 화면 라우트: [web/src/pages](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/pages), 라우터 [router.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/router/router.tsx), 파일 라우팅 설정 [vite.config.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/vite.config.ts)
- 앱 셸: [web/src/app/layout](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/layout)
- 키트 레이아웃: [web/src/shared/ui/kit/layout](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/layout)
- Query 클라이언트: [query-client.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/model/query-client.ts)
- 데이터 준비: [prepare.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib/prepare.ts)
- 지연 로딩 래퍼: [preloadable.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib/preloadable.tsx)
- 미리 준비: [use-intent-preload.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/layout/use-intent-preload.ts), 진행 표시 [RouteStage.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/layout/RouteStage.tsx)
- 메뉴 주소: [route-location.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib/route-location.ts)
- 마스킹: [panel.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib/panel.ts), [PanelHost.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/layout/PanelHost.tsx)
- 링크: [row-link.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/row-link.tsx), [RichBody.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/rich-body/RichBody.tsx)
- 화면 규칙 검사: [check-ui.mjs](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/scripts/check-ui.mjs)

## 작업 절차

화면 코드를 바꾸면 `web/`에서 `npm run check`를 실행합니다. 화면 규칙 검사(`lint:ui`), ESLint, knip, 스크립트 테스트, 타입 검사와 빌드를 차례로 돌립니다.

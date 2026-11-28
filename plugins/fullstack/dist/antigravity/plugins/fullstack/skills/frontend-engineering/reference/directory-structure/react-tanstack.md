# 디렉토리 구조 (React · TanStack)

공통 계층 규칙은 [디렉토리 구조](index.md)를 따릅니다. React에서는 파일 기반 라우팅을 지원하는 라우터(기준: TanStack Router)가 `src/pages`를 직접 읽어 주소 트리를 생성합니다.

## 1. 폴더 구조와 파일 규약

```tree
src/
  app/
    router/
      router.ts           # 라우터 생성과 전역 컨텍스트 연결
      routeTree.gen.ts    # 플러그인이 자동 생성하는 라우트 트리
    providers/            # QueryClient, 테마 등 전역 프로바이더
  pages/
    __root.tsx            # 전역 루트 레이아웃과 공통 가드
    _app/                 # 경로 없는 레이아웃 (URL에 _app 미포함)
      route.tsx           # 로그인·권한 확인, 공통 데이터 준비
      items/
        route.tsx         # /items 하위 공통 레이아웃·권한
        page.tsx          # /items 화면
        $itemId/
          page.tsx        # /items/:itemId 화면
          ui/             # 이 화면 전용 UI 컴포넌트
          api/            # 이 화면 전용 조회 옵션
    login/
      page.tsx            # /login 화면
  widgets/                # (선택) 여러 페이지에서 공유하는 복합 UI 블록
    <widget>/
      ui/
      model/
      index.ts            # 공개 API
  features/
    <feature>/
      ui/
      model/
      api/
      index.ts            # 공개 API
  entities/
    <entity>/
      ui/
      model/
      api/
      index.ts            # 공개 API
  shared/
    api/
    config/
    lib/
    ui/
```

| 파일 · 폴더 | 역할 |
| - | - |
| `__root.tsx` | 앱 전체 최상위 루트 레이아웃 |
| `route.tsx` | 해당 폴더와 모든 하위 주소에 적용되는 레이아웃·가드(`beforeLoad`)·공통 로더 |
| `page.tsx` | 해당 주소의 실제 화면(`indexToken: "page"`) |
| `_<name>/` | URL에 나타나지 않는 경로 없는 레이아웃 묶음 |
| `$<param>/` | 동적 경로 매개변수 폴더 |
| `ui/`, `model/`, `api/`, `lib/`, `config/`, `index.ts` | 라우트로 인식하지 않는 슬라이스 세그먼트 및 공개 진입점 |

## 2. 파일 라우팅과 세그먼트 무시 설정

`vite.config.ts`에서 라우트 루트를 `./src/pages`로 지정하고, FSD 세그먼트 폴더와 `index.ts`를 라우트 스캔에서 제외합니다.

```ts
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      routesDirectory: "./src/pages",
      generatedRouteTree: "./src/app/router/routeTree.gen.ts",
      autoCodeSplitting: true,
      indexToken: "page",
      routeFileIgnorePattern: "^(ui|api|model|lib|config|index\\.ts)$",
    }),
    react(),
  ],
});
```

- `routeTree.gen.ts`는 자동 생성 파일이므로 손으로 수정하지 않으며, 린트·포맷 검사 대상에서 제외합니다.

## 3. 부모 라우트와 화면 파일 분리

경로 없는 레이아웃(`_app/route.tsx`)은 인증·리다이렉트 같은 경계 로직을 맡고, 실제 화면(`page.tsx`)은 자기 폴더의 `api/`·`ui/`와 하위 레이어만 참조합니다.

```tsx
// src/pages/_app/route.tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { sessionOptions } from "@/entities/session";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionOptions());
    if (!session) throw redirect({ to: "/login" });
    return { session };
  },
});
```

```tsx
// src/pages/_app/items/page.tsx
import { createFileRoute } from "@tanstack/react-router";
import { itemsOptions } from "./api/items";
import { ItemsPage } from "./ui/ItemsPage";

export const Route = createFileRoute("/_app/items/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(itemsOptions()),
  component: ItemsPage,
});
```

- `pages`는 `app` 레이어를 import하지 않습니다. 앱 셸처럼 `app`에 속한 외곽 틀을 붙여야 하면 `app/router` 또는 상위 레이아웃 경계에서 주입합니다.

## 4. 경로 별칭과 공개 API

`tsconfig.json`과 `vite.config.ts`에 `@/* → ./src/*` 별칭을 설정합니다.

- 다른 레이어의 슬라이스를 가져올 때는 항상 공개 API(`@/entities/user`, `@/features/item-filter`)를 사용합니다.
- `@/entities/user/model/types`처럼 내부 세그먼트 경로를 직접 참조하지 않습니다.

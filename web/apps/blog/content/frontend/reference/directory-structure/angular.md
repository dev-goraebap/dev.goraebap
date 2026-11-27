---
title: 디렉토리 구조 (Angular)
summary: 파일 기반 라우팅이 없는 Angular 환경에서 설정 기반 routes.ts로 주소 기반 pages와 FSD 레이어를 맞추는 기준입니다.
---

공통 계층 규칙은 [디렉토리 구조](./index.md)를 따릅니다. Angular는 파일 기반 라우팅을 제공하지 않으므로, **`pages/` 폴더 트리는 URL과 1:1로 유지하되 각 폴더마다 `routes.ts`를 두고 부모가 `loadChildren`으로 자식을 잇는 방식**으로 같은 구조를 구현합니다.

## 1. 폴더 구조와 파일 규약

```tree
src/
  app/
    app.ts                  # 루트 컴포넌트 (<router-outlet />)
    app.config.ts           # provideRouter, provideHttpClient 등 전역 프로바이더
    app.routes.ts           # 최상위 pages/*/routes.ts 연결
  pages/
    workspace/              # 경로 없는 레이아웃 (path: "") + 인증 가드 + 셸
      routes.ts             # 셸·가드 정의 및 하위 폴더 loadChildren 연결
      ui/
        workspace-shell.ts  # 하위 주소 공통 외곽 셸
      home/
        routes.ts           # path: "" → HomePage
        ui/
          home-page.ts
      items/
        routes.ts           # /items 및 하위 주소 정의
        ui/
          items-page.ts
        api/
          items.api.ts
    login/
      routes.ts
      ui/
        login-page.ts
  widgets/                  # (선택) 여러 페이지에서 공유하는 복합 UI 블록
    <widget>/
      ui/
      model/
      index.ts              # 공개 API
  features/
    <feature>/
      ui/
      model/
      api/
      index.ts              # 공개 API
  entities/
    <entity>/
      ui/
      model/
      api/
      index.ts              # 공개 API
  shared/
    api/
    config/
    lib/
    ui/
```

| 파일 · 폴더 | 역할 |
| --- | --- |
| `app/app.routes.ts` | 최상위 라우트 진입표. 각 최상위 `pages/<slice>/routes.ts`를 `loadChildren`으로 연결 |
| `pages/.../routes.ts` | 해당 주소의 가드(`canActivate`), 셸 컴포넌트, 화면 컴포넌트, 하위 폴더 `loadChildren` 정의 |
| `pages/.../ui/*-page.ts` | 해당 주소의 Standalone 화면 컴포넌트 |
| `pages/.../ui/*-shell.ts` | 하위 주소를 감싸는 부모 라우트 셸 컴포넌트 |

- 파일 라우팅 스캔이 없으므로 세그먼트(`ui/`, `model/`, `api/`) 무시 설정이 필요하지 않습니다. 대신 `routes.ts`가 폴더의 라우트 진입점 역할을 맡습니다.

## 2. 최상위 라우트와 부모-자식 `routes.ts` 연결

`app.routes.ts`는 최상위 주소 묶음만 선언하고, 세부 화면은 각 `pages/` 폴더의 `routes.ts`에 위임합니다.

```ts
// src/app/app.routes.ts
import type { Routes } from "@angular/router";

export const routes: Routes = [
  { path: "login", loadChildren: () => import("@/pages/login/routes") },
  { path: "", loadChildren: () => import("@/pages/workspace/routes") },
  { path: "**", redirectTo: "" },
];
```

경로 없는 레이아웃은 `path: ""` 라우트에 `canActivate`와 셸 `component`를 걸고, `children`에서 하위 폴더의 `routes.ts`를 지연 로딩합니다.

```ts
// src/pages/workspace/routes.ts
import type { Routes } from "@angular/router";
import { signedInGuard } from "@/entities/session";
import { WorkspaceShell } from "./ui/workspace-shell";

export default [
  {
    path: "",
    canActivate: [signedInGuard],
    component: WorkspaceShell,
    children: [
      { path: "", loadChildren: () => import("./home/routes") },
      { path: "items", loadChildren: () => import("./items/routes") },
    ],
  },
] satisfies Routes;
```

말단 주소 폴더의 `routes.ts`는 빈 경로(`path: ""`)에 해당 화면 컴포넌트를 연결합니다.

```ts
// src/pages/workspace/items/routes.ts
import type { Routes } from "@angular/router";
import { ItemsPage } from "./ui/items-page";

export default [{ path: "", component: ItemsPage }] satisfies Routes;
```

- `export default [...] satisfies Routes;` 형식을 사용하면 Angular Router의 `loadChildren: () => import("./items/routes")`가 기본 내보내기를 별도 `.then()` 없이 바로 읽습니다.
- 폴더 구조와 `children`의 `path`가 항상 1:1로 일치하도록 유지합니다.

## 3. Standalone 컴포넌트와 경로 별칭

- `NgModule`을 만들지 않고 모든 화면·UI 조각을 Standalone 컴포넌트로 작성합니다.
- `tsconfig.json`에 `"@/*": ["./src/*"]` 별칭을 두고, 다른 레이어의 슬라이스는 항상 공개 API(`@/entities/session`, `@/features/item-filter`)를 통해 참조합니다.
- 같은 `pages/` 내 부모-자식 라우트 연결은 상대 경로(`./items/routes`)로 두고, 형제 라우트 폴더는 참조하지 않습니다.

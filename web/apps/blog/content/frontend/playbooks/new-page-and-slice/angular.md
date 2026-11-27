---
title: 화면·슬라이스 추가 (Angular)
summary: Angular 앱에서 새 라우트 슬라이스를 만들고 부모 routes.ts에 loadChildren으로 연결하는 절차입니다.
---

공통 배치 원칙은 [화면·슬라이스 추가](./index.md), 규칙 명세는 [디렉토리 구조 (Angular)](../../reference/directory-structure/angular.md)를 참고합니다.

## 1. 라우트 슬라이스 폴더 생성

예를 들어 `workspace` 아래에 `/projects`와 `/projects/:projectId` 화면을 추가한다면 URL 구조에 맞춰 폴더와 `routes.ts`를 만듭니다.

```tree
src/pages/workspace/projects/
  routes.ts                 # /projects와 하위 :projectId 연결
  ui/
    projects-page.ts        # /projects 화면 컴포넌트
  api/
    projects.api.ts
  detail/
    routes.ts               # :projectId 화면 연결
    ui/
      project-detail-page.ts
```

## 2. 자식 `routes.ts` 작성과 부모 연결

말단(또는 중간) 폴더의 `routes.ts`에 화면 컴포넌트와 하위 경로를 정의합니다.

```ts
// src/pages/workspace/projects/routes.ts
import type { Routes } from "@angular/router";
import { ProjectsPage } from "./ui/projects-page";

export default [
  { path: "", component: ProjectsPage },
  { path: ":projectId", loadChildren: () => import("./detail/routes") },
] satisfies Routes;
```

그다음 부모 폴더의 `routes.ts`에 `loadChildren`으로 새 슬라이스를 등록합니다.

```ts
// src/pages/workspace/routes.ts
children: [
  { path: "", loadChildren: () => import("./home/routes") },
  { path: "projects", loadChildren: () => import("./projects/routes") },
],
```

## 3. 재사용 코드 승격과 공개 API

여러 화면에서 공유하는 도메인 모델·조회 옵션·표시 컴포넌트가 생기면 `src/entities/project/`(또는 사용자 동작이면 `src/features/<feature>/`)로 옮기고 `index.ts`를 공개 API로 둡니다.

```ts
// src/entities/project/index.ts
export { projectsOptions, projectOptions } from "./api/projects.api";
export type { Project } from "./model/project.types";
export { ProjectBadge } from "./ui/project-badge";
```

호출하는 화면에서는 항상 슬라이스 루트(`@/entities/project`)만 import합니다.

## 4. 검증

```bash
pnpm typecheck && pnpm build
```

컴파일과 템플릿 타입 검사에서 라우트 입력 바인딩이나 잘못된 상대 경로가 없는지 확인합니다.

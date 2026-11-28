# 화면·슬라이스 추가 (React · TanStack)

공통 배치 원칙은 [화면·슬라이스 추가](index.md), 규칙 명세는 [디렉토리 구조 (React · TanStack)](../../reference/directory-structure/react-tanstack.md)를 참고합니다.

## 1. 라우트 슬라이스 폴더 생성

예를 들어 로그인한 영역(`_app`) 아래에 `/projects`와 `/projects/:projectId` 화면을 추가한다면 URL 구조 그대로 폴더를 만듭니다.

```tree
src/pages/_app/projects/
  route.tsx          # /projects 하위 공통 레이아웃·권한(필요 시)
  page.tsx           # /projects 목록 화면
  ui/
    ProjectsView.tsx
  api/
    projects.ts
  $projectId/
    page.tsx         # /projects/:projectId 상세 화면
```

## 2. 라우트 파일 작성

`page.tsx`는 라우트 진입점(로더·검색 파라미터 검증·화면 연결)만 간결하게 두고, 화면 구성은 `ui/`로 분리합니다.

```tsx
// src/pages/_app/projects/page.tsx
import { createFileRoute } from "@tanstack/react-router";
import { projectsOptions } from "./api/projects";
import { ProjectsView } from "./ui/ProjectsView";

export const Route = createFileRoute("/_app/projects/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsOptions()),
  component: ProjectsView,
});
```

## 3. 재사용 코드 승격과 공개 API

`projectsOptions`나 프로젝트 카드 컴포넌트가 대시보드 등 다른 경로에서도 필요해지면 `src/entities/project/`로 옮기고 `index.ts`만 엽니다.

```ts
// src/entities/project/index.ts
export { projectsOptions, projectOptions } from "./api/projects";
export type { Project } from "./model/types";
export { ProjectBadge } from "./ui/ProjectBadge";
```

호출하는 화면에서는 슬라이스 루트만 가져옵니다.

```ts
import { ProjectBadge, projectsOptions } from "@/entities/project";
```

## 4. 라우트 트리 갱신과 검증

개발 서버(`pnpm dev`) 또는 빌드를 실행해 `src/app/router/routeTree.gen.ts`가 갱신되었는지 확인한 뒤 전체 검사를 실행합니다.

```bash
pnpm typecheck && pnpm lint && pnpm build
```

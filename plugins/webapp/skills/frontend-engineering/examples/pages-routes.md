---
arc42: "8.4, 2"
---

# 주소가 곧 pages 폴더

`pages` 폴더 하나가 주소 하나이고, 폴더마다 부모 경로 파일과 화면 파일을 나눠 두며, 주소에 나타나지 않는 묶음 폴더로 여러 주소에 같은 틀을 겁니다. 규칙은 [코드 작성](../references/structure.md#화면-계층-묶기)에 있습니다.

## react

출처: [web/vite.config.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/vite.config.ts)

```ts
export default defineConfig({
  // …
  plugins: [
    // 파일 라우팅: src/pages의 폴더가 곧 주소다. page.tsx가 그 주소의 화면, route.tsx가 그 아래에 걸리는 틀이다.
    // 슬라이스 안의 세그먼트(ui · api · model · lib · config)와 공개 진입점(index.ts)은 라우트로 치지 않는다.
    tanstackRouter({
      target: 'react',
      routesDirectory: './src/pages',
      generatedRouteTree: './src/app/router/routeTree.gen.ts',
      autoCodeSplitting: true, indexToken: 'page', routeFileIgnorePattern: '^(ui|api|model|lib|config|index\\.ts)$',
      quoteStyle: 'single',
    }),
    react(), tailwindcss(), solarSet(), initialCover(),
  ],
  // …
});
```

TanStack Router의 파일 라우팅이 `src/pages`를 읽고, `indexToken: 'page'`로 `page.tsx`를 그 주소의 화면 파일로 삼습니다. `routeFileIgnorePattern`이 슬라이스 세그먼트와 공개 진입점을 라우트에서 뺍니다.

출처: [web/src/pages/_app/route.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/pages/_app/route.tsx)

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { sessionOptions } from '@/shared/auth';

/**
 * 로그인한 사람의 앱 틀: 주소에 나타나지 않는 단계. 로그인하지 않았으면 로그인으로, 온보딩 전이면 환영으로 보낸다.
 * 틀 화면(사이드바 · 패널)은 app 층이 router.tsx에서 붙인다. pages는 app을 가져오지 않는다.
 */
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.query({ ...sessionOptions(), staleTime: 'static' });
    if (!session) throw redirect({ to: '/login' });
    if (!session.onboarded) throw redirect({ href: '/onboarding', replace: true });
    return { session };
  },
});
```

`_app` 폴더는 주소에 나타나지 않는 묶음 폴더입니다. 이 폴더의 `route.tsx`가 로그인 확인을 맡아, 그 아래 모든 주소에 같은 틀이 걸립니다.

출처: [web/src/pages/_app/instance/route.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/pages/_app/instance/route.tsx)

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { HOME_PATH } from '@/shared/config';
import { isExactly } from '@/shared/lib/route-location';

/** /instance 아래 전부: 인스턴스 관리자만 연다(그 밖의 사람은 홈으로). /instance 자체는 첫 화면(구성원 · 권한)으로 보낸다. */
export const Route = createFileRoute('/_app/instance')({
  beforeLoad: ({ context, location }) => {
    if (!(context.session.roles ?? []).includes('INSTANCE_ADMIN')) throw redirect({ href: HOME_PATH, replace: true });
    if (isExactly(location.pathname, '/instance')) throw redirect({ href: '/instance/members' + location.searchStr, replace: true });
  },
});
```

출처: [web/src/pages/_app/instance/members/page.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/pages/_app/instance/members/page.tsx)

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { rolesOptions } from './api/roles';
import { RolesPage } from './ui/RolesPage';

/** /instance/members: 구성원 · 권한. */
export const Route = createFileRoute('/_app/instance/members/')({
  loader: ({ context }) => context.queryClient.query({ ...rolesOptions(), staleTime: 'static' }),
  component: function MembersRoute() { return <RolesPage crumbs={useCrumbs()} />; },
});
```

`instance/route.tsx`는 그 아래 주소들의 권한 확인을, `instance/members/page.tsx`는 `/instance/members` 화면을 맡습니다. 화면 파일은 `pages` 안에서 자기 폴더의 `api/`와 `ui/`만 가져오고 형제 주소의 코드는 가져오지 않습니다.

## angular

출처: [web/apps/accounts/src/app/app.routes.ts](https://github.com/dev-goraebap/dev.goraebap/blob/9ab5efcb944c053f149d5f6cb5e12d1359ef9c7a/web/apps/accounts/src/app/app.routes.ts)

```ts
// 주소 하나가 pages 아래 폴더 하나다. 폴더마다 routes.ts가 그 주소와 아래 주소를 정한다.
export const routes: Routes = [
  { path: "login", loadChildren: () => import("@/pages/login/routes") },
  { path: "onboarding", loadChildren: () => import("@/pages/onboarding/routes") },
  { path: "", loadChildren: () => import("@/pages/account/routes") },
  { path: "**", redirectTo: "" },
];
```

출처: [web/apps/accounts/src/pages/account/routes.ts](https://github.com/dev-goraebap/dev.goraebap/blob/9ab5efcb944c053f149d5f6cb5e12d1359ef9c7a/web/apps/accounts/src/pages/account/routes.ts)

```ts
// 로그인한 사람의 계정 화면. 이 폴더가 셸과 가드를 맡고, 아래 폴더가 각 주소의 화면을 맡는다.
export default [
  {
    path: "",
    canActivate: [signedIn],
    component: AccountShell,
    children: [
      { path: "", loadChildren: () => import("./home/routes") },
      { path: "profile", loadChildren: () => import("./profile/routes") },
      { path: "security", loadChildren: () => import("./security/routes") },
    ],
  },
] satisfies Routes;
```

Angular 라우터는 파일 라우팅이 없어서 폴더마다 `routes.ts`를 두고 부모가 `loadChildren`으로 자식 폴더를 잇습니다. `pages/account`의 라우트 파일이 레이아웃(셸)과 가드를 맡고, `profile`·`security` 폴더가 각 주소의 화면을 맡아 폴더 구조와 주소가 1:1로 맞습니다.

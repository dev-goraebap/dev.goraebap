---
arc42: "8.4, 2"
---

# 이동 중인 주소로 메뉴 계산

사이드바의 메뉴와 고른 표시는 이동이 끝난 주소가 아니라 이동 중인 주소로 계산합니다. 규칙은 [화면 전환](../references/navigation.md#공간과-메뉴의-주소)에 있습니다.

## react

출처: [web/src/shared/lib/route-location.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib/route-location.ts)

```ts
import { useRouterState } from '@tanstack/react-router';

/** Follow the rendered match, including the commit before onResolved, rather than only the router status. */
export function usePageLocation() {
  return useRouterState({ select: state =>
    state.status !== 'pending' || (state.matches.at(-1)?.pathname === state.location.pathname
      && JSON.stringify(state.matches.at(-1)?.search) === JSON.stringify(state.location.search))
      ? state.location
      : state.resolvedLocation ?? state.location });
}

/** 지금 준비 중인 이동의 목적지 경로(없으면 undefined). 누른 메뉴의 선택 표시를 응답 전에 옮길 때 쓴다. */
export function usePendingPathname() {
  return useRouterState({ select: state => state.status === 'pending' && state.resolvedLocation
    && state.location.pathname !== state.resolvedLocation.pathname ? state.location.pathname : undefined });
}
```

`usePendingPathname()`은 라우터가 다음 화면을 준비하는 동안 목적지 경로를 돌려주고, 준비 중이 아니면 `undefined`입니다.

출처: [web/src/app/layout/AppShellLayout.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/layout/AppShellLayout.tsx)

```tsx
export function AppShellLayout() {
  useIntentPreload();
  const panel = usePanel();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { pathname, searchStr } = usePageLocation();
  // 메뉴는 누른 곳을 바로 따른다(2026-11-15): 페이지는 읽을 것을 준비한 뒤에 바뀌지만, 사이드 메뉴(공간 · 고른 항목)는 가는
  // 주소의 것으로 먼저 바뀌어 공간을 바꿀 때 멈춘 듯 보이지 않는다. 페이지 머리와 본문은 준비된 주소를 그대로 따른다.
  const menuPathname = usePendingPathname() ?? pathname;
  // …
  const key = projectKeyOf(menuPathname);
  const isSignedIn = !!session && !sessionChanged;
  const project = useQuery({ ...projectOptions(key ?? ''), enabled: isSignedIn && !!key });
  // 페이지 머리 경로는 준비된 주소를 따른다(메뉴는 누른 주소를 먼저 따른다). 프로젝트 안이면 첫 단계에 프로젝트 이름을 단다.
  const pageKey = projectKeyOf(pathname);
  const pageProject = useQuery({ ...projectOptions(pageKey ?? ''), enabled: isSignedIn && !!pageKey });
  const pageProjectName = pageProject.data?.name;
  const crumbs = useMemo(() => crumbsOf(pathname, pageProjectName), [pathname, pageProjectName]);
  // …
  return <AppFrame pathname={menuPathname} search={searchStr} myProjects={myProjects}
    // …
    <PageCrumbsProvider value={crumbs}><RouteStage /></PageCrumbsProvider>
    // …
  </AppFrame>;
}
```

`AppFrame`의 메뉴는 `menuPathname`으로 그려 누르는 즉시 가는 공간의 것으로 바뀝니다. 페이지 머리 경로(`crumbs`)는 그려진 화면의 주소인 `pathname`을 따르므로, 본문과 머리는 다음 화면이 준비될 때 함께 바뀝니다.

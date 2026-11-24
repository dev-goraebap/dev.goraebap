---
arc42: "8.4, 2"
---

# 링크 의도 미리 준비와 미리 받는 지연 로딩

앱 안 링크에 포인터나 초점이 오면 문서에 한 번 건 처리기가 그 화면을 미리 준비하고, 지연 로딩 컴포넌트는 미리 받는 함수를 가진 래퍼로 감쌉니다. 규칙은 [화면 전환](../references/navigation.md)에 있습니다.

## react

출처: [web/src/app/layout/use-intent-preload.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/layout/use-intent-preload.ts)

```ts
import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

/** 같은 주소를 다시 준비하기 전에 기다리는 시간. 그 안의 재방문은 이미 받은 캐시로 즉시 그린다. */
const AGAIN_MS = 10_000;

/**
 * 앱 안의 링크에 포인터가 올라가거나 초점이 오면 그 화면을 미리 준비한다(intent prefetch). 화면마다 따로 붙이지 않고
 * 문서에 한 번 건다: 목록 행·카드·사이드바·경로처럼 a[href]로 그린 것은 모두 해당한다. 준비는 라우트 loader(각 page.tsx)
 * 그대로라, 누르면 캐시가 있어 진행 막대 없이 바로 바뀐다.
 */
export function useIntentPreload() {
  const router = useRouter();
  useEffect(() => {
    const prepared = new Map<string, number>();
    const prepare = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      const href = link?.getAttribute('href');
      if (!href || !href.startsWith('/') || href.startsWith('//') || link?.hasAttribute('download') || link?.getAttribute('target') === '_blank') return;
      const path = href.split(/[?#]/, 1)[0];
      if (path === window.location.pathname || path === '/login' || path.startsWith('/api/')) return;
      const now = Date.now();
      if (now - (prepared.get(href) ?? 0) < AGAIN_MS) return;
      prepared.set(href, now);
      void router.preloadRoute({ to: href as never }).catch(() => undefined);
    };
    document.addEventListener('pointerover', prepare, { passive: true });
    document.addEventListener('focusin', prepare);
    return () => { document.removeEventListener('pointerover', prepare); document.removeEventListener('focusin', prepare); };
  }, [router]);
}
```

`AppShellLayout`이 이 훅을 한 번 부릅니다. `pointerover`·`focusin`에서 앱 안 `a[href]`를 찾아 `router.preloadRoute()`로 준비하고, 같은 주소는 `AGAIN_MS` 안에 다시 부르지 않습니다.

출처: [web/src/shared/lib/preloadable.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib/preloadable.tsx)

```tsx
import { createElement, lazy, type ComponentType } from 'react';

/**
 * 지연 로딩하는 부품을 미리 받아 둘 수 있게 한다. React.lazy는 코드가 이미 받아져 있어도 처음 그릴 때 한 번 멈추고(Suspense),
 * 그동안 그 자리가 비어 아래 내용이 밀린다. 라우트 준비(page.tsx의 loader, shared/lib/prepare)에서 preload를 불러 두면 첫 그림부터 바로 그린다.
 * 받기 전에 그리면 보통의 lazy처럼 가장 가까운 Suspense에서 기다린다.
 */
export function preloadable<P extends object>(load: () => Promise<ComponentType<P>>) {
  let loaded: ComponentType<P> | undefined;
  let pending: Promise<ComponentType<P>> | undefined;
  const preload = () => (pending ??= load().then(component => (loaded = component)));
  const Lazy = lazy(() => preload().then(component => ({ default: component })));
  function Preloadable(props: P) {
    return createElement((loaded ?? Lazy) as ComponentType<P>, props);
  }
  return Object.assign(Preloadable, { preload });
}
```

`preload()`로 코드를 받아 두면 `loaded`가 채워져 `React.lazy`를 거치지 않고 바로 그립니다. 본문 칸 `RichBody`가 이 래퍼로 감싸져 있고, 준비 함수의 `body()`가 데이터와 함께 `RichBody.preload()`를 부릅니다.

출처: [web/src/app/router/router.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/router/router.tsx)

```tsx
export const createAppRouter = (queryClient: QueryClient) => createRouter({
  routeTree, context: { queryClient }, defaultPreload: 'intent', defaultPreloadStaleTime: 0,
  // 다음 경로가 준비될 때까지 기존 화면을 유지하고, 오래 걸리면 RouteStage가 상단 진행 막대를 띄운다.
  defaultPendingMs: Infinity,
  defaultGcTime: 0,
  // …
});
```

라우터는 준비 결과를 기억하지 않고, 데이터는 TanStack Query 캐시가 들고 있습니다. `defaultPendingMs: Infinity`로 다음 화면이 준비될 때까지 지금 화면을 그대로 둡니다.

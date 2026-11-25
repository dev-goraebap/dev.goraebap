# 페이지 전환과 대기 (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## router-setup

TanStack Router에 View Transition과 대기 임계 시간을 설정하고, 라우트 loader가 캐시를 먼저 확인해 선조회합니다. 캐시가 있으면 loader가 바로 끝나 진행 막대 없이 전환됩니다.

```tsx
import { createRouter } from "@tanstack/react-router";

// 1. 라우터에 View Transition과 대기 임계 시간 설정
export const router = createRouter({
  routeTree,
  defaultViewTransition: true,
  defaultPendingMs: 150, // 150ms 안에 끝나는 이동은 진행 표시 없이 바로 전환
});

// 2. 라우트 loader에서 캐시 우선 선조회 (캐시가 있으면 기다리지 않음)
export const Route = createFileRoute("/projects/$id")({
  loader: ({ context, params }) => context.queryClient.query(projectQueryOptions(params.id)),
});
```

## progress-bar

이동이 `SHOW_AFTER_MS` 안에 끝나면 진행 표시를 띄우지 않고, 띄웠으면 `KEEP_AT_LEAST_MS`를 채운 뒤 내립니다. 화면 읽기 프로그램에는 `role="status"` 문구로 알리고 준비 중 여부는 `aria-busy`로 드러냅니다. 아래 발췌는 시간 처리를 보여 주는 예이고, 막대의 자리는 위 규칙대로 화면 맨 위에 둡니다.

출처: [web/src/app/layout/RouteStage.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/layout/RouteStage.tsx)

```tsx
/** 이 시간 안에 끝나는 이동에는 진행 막대를 띄우지 않는다. */
const SHOW_AFTER_MS = 150;
/** 한 번 띄운 막대는 이만큼은 두어 깜빡이지 않게 한다. */
const KEEP_AT_LEAST_MS = 300;
// …
export function RouteStage() {
  const moving = useRouterState({ select: state => state.status === 'pending' && !!state.resolvedLocation
    && (state.location.pathname !== state.resolvedLocation.pathname || isWorkItemViewChange(state.resolvedLocation, state.location)) });
  const [shown, setShown] = useState(false);
  const shownAt = useRef(0);
  useEffect(() => {
    if (moving) {
      const timer = setTimeout(() => { shownAt.current = Date.now(); setShown(true); }, SHOW_AFTER_MS);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setShown(false), Math.max(0, KEEP_AT_LEAST_MS - (Date.now() - shownAt.current)));
    return () => clearTimeout(timer);
  }, [moving]);
  return (
    <div className="relative isolate flex h-full min-h-0 min-w-0 flex-col" aria-busy={moving}>
      {/* 늘 그려 두고 보이기만 바꾼다(나타나고 사라질 때 부드럽게). 화면 읽기 프로그램에는 상태 문구로 알린다. */}
      <div aria-hidden data-route-progress={shown ? '' : undefined}
        className={cn('route-glow pointer-events-none absolute inset-x-0 top-0 z-4 h-0.5 opacity-0 transition-opacity duration-240',
          shown && 'opacity-100 motion-safe:animate-[route-glow-flow_1.6s_ease-in-out_infinite,route-glow-breathe_2.4s_ease-in-out_infinite]')} />
      <p className="sr-only" role="status" aria-live="polite">{shown ? '다음 화면을 불러오는 중' : ''}</p>
      {/* 전환 스냅숏은 상위 카드의 잘림을 상속하지 않으므로 캡처 대상 자체에서 넘치는 메뉴와 스크롤을 자른다. */}
      <div className="route-content flex h-full min-h-0 min-w-0 flex-col overflow-clip"><Outlet /></div>
    </div>
  );
}
```

## crossfade

페이지 이동의 교차 페이드 이름 `cowork-content`는 `.route-content`에만 붙고, 문서 루트의 기본 스냅숏은 `view-transition-name: none`으로 뺍니다. 동작 줄이기 설정에서는 교차 페이드를 끕니다.

출처: [web/src/app/styles/index.css](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/styles/index.css)

```css
/* Only the page content is captured. The shell and native dialogs stay live. */
:root { view-transition-name: none; }
::view-transition { pointer-events: none; }
::view-transition-group(cowork-content) { animation-duration: 200ms; animation-timing-function: ease-in-out; }
::view-transition-image-pair(cowork-content) { isolation: isolate; }
::view-transition-old(cowork-content) { animation: cowork-content-out 200ms ease-in-out both; mix-blend-mode: plus-lighter; }
::view-transition-new(cowork-content) { animation: cowork-content-in 200ms ease-in-out both; mix-blend-mode: plus-lighter; }
@keyframes cowork-content-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes cowork-content-in { from { opacity: 0; } to { opacity: 1; } }
/* … */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(cowork-content), ::view-transition-old(cowork-content), ::view-transition-new(cowork-content) { animation: none; }
}
/* … */
.route-content { view-transition-name: cowork-content; }
```

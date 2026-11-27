---
title: 라우팅과 화면 전환 (React · TanStack)
summary: TanStack Router의 intent preload, 지연 진행 막대, 이동 중 경로 반영, 주소 마스킹 구현 기준입니다.
---

공통 리소스 주소 계약과 전환·마스킹 원칙은 [라우팅과 화면 전환](./index.md)을 따릅니다. React · TanStack 스택에서는 TanStack Router의 파일 라우팅, `defaultViewTransition`, `mask` 기능으로 구현합니다.

## 1. 라우터 기본 설정

라우터는 준비 결과를 자체 캐싱하지 않고(`defaultGcTime: 0`, `defaultPreloadStaleTime: 0`), 데이터 수명은 TanStack Query 캐시가 단일 원본으로 관리하게 둡니다.

```tsx
import { createRouter } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";

export const createAppRouter = (queryClient: QueryClient) =>
  createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultGcTime: 0,
    defaultViewTransition: true,
    // 다음 화면 준비가 끝날 때까지 이전 화면을 유지하고,
    // 150ms 이상 지연될 때만 RouteStage가 상단 진행 막대를 띄웁니다.
    defaultPendingMs: Infinity,
    // 마스킹된 대화상자 주소를 새로고침하면 독립 대상 페이지로 엽니다.
    unmaskOnReload: true,
  });
```

## 2. 문서 전역 Intent Prefetch

앱 셸 최상위에서 문서 수준 `pointerover`·`focusin` 이벤트를 한 번만 등록해, 일반 `<a href>`로 그려진 모든 내부 링크를 미리 준비합니다.

```ts
import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

const PRELOAD_COOLDOWN_MS = 10_000;

export function useIntentPreload() {
  const router = useRouter();

  useEffect(() => {
    const preparedAt = new Map<string, number>();

    const onIntent = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      const href = link?.getAttribute("href");
      if (
        !href ||
        !href.startsWith("/") ||
        href.startsWith("//") ||
        link?.hasAttribute("download") ||
        link?.getAttribute("target") === "_blank"
      ) {
        return;
      }
      const path = href.split(/[?#]/, 1)[0];
      if (path === window.location.pathname || path === "/login" || path.startsWith("/api/")) {
        return;
      }
      const now = Date.now();
      if (now - (preparedAt.get(href) ?? 0) < PRELOAD_COOLDOWN_MS) return;
      preparedAt.set(href, now);
      void router.preloadRoute({ to: href as never }).catch(() => undefined);
    };

    document.addEventListener("pointerover", onIntent, { passive: true });
    document.addEventListener("focusin", onIntent);
    return () => {
      document.removeEventListener("pointerover", onIntent);
      document.removeEventListener("focusin", onIntent);
    };
  }, [router]);
}
```

## 3. 지연 진행 막대와 이동 중 주소

- **진행 막대 (`RouteStage`)**: `150ms` 임계와 `300ms` 최소 유지 시간을 지키고, `aria-busy`와 `role="status"`로 접근성을 제공합니다.

```tsx
import { useEffect, useRef, useState } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";

const SHOW_AFTER_MS = 150;
const KEEP_AT_LEAST_MS = 300;

export function RouteStage() {
  const moving = useRouterState({
    select: (s) =>
      s.status === "pending" &&
      Boolean(s.resolvedLocation) &&
      s.location.pathname !== s.resolvedLocation?.pathname,
  });
  const [shown, setShown] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    if (moving) {
      const timer = window.setTimeout(() => {
        shownAt.current = Date.now();
        setShown(true);
      }, SHOW_AFTER_MS);
      return () => window.clearTimeout(timer);
    }
    const remaining = Math.max(0, KEEP_AT_LEAST_MS - (Date.now() - shownAt.current));
    const timer = window.setTimeout(() => setShown(false), remaining);
    return () => window.clearTimeout(timer);
  }, [moving]);

  return (
    <div className="relative isolate flex h-full min-h-0 flex-col" aria-busy={moving}>
      <div
        aria-hidden
        data-route-progress={shown ? "" : undefined}
        className={
          shown
            ? "pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 bg-primary opacity-100 transition-opacity"
            : "pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 bg-primary opacity-0 transition-opacity"
        }
      />
      <p className="sr-only" role="status" aria-live="polite">
        {shown ? "다음 화면을 불러오는 중" : ""}
      </p>
      <div className="flex h-full min-h-0 flex-col overflow-clip">
        <Outlet />
      </div>
    </div>
  );
}
```

- **이동 중 주소 (`usePendingPathname`)**: 사이드바 선택 표시는 `usePendingPathname() ?? pathname`으로 계산해 누르는 즉시 옮기고, 페이지 헤더 경로(브레드크럼)는 확정된 `pathname`을 따릅니다.

```ts
import { useRouterState } from "@tanstack/react-router";

export function usePendingPathname() {
  return useRouterState({
    select: (s) =>
      s.status === "pending" &&
      s.resolvedLocation &&
      s.location.pathname !== s.resolvedLocation.pathname
        ? s.location.pathname
        : undefined,
  });
}
```

## 4. 라우팅 마스크 (`useOpenPanel` · `usePanel`)

목록 주소에 `?panel=<대상 주소>` 쿼리를 달고 TanStack Router의 `mask` 옵션으로 주소창에만 대상 주소를 노출합니다. 패널 열기·닫기·크게 보기 로직은 공용 훅(`shared/lib/panel.ts`) 한 곳에 모읍니다.

```ts
import { useLocation, useNavigate, useRouter } from "@tanstack/react-router";

const PANEL_KEY = "panel";
const MARK_KEY = "panelOrigin";
const ROOT_ENTRY = "opened-here";

export function useOpenPanel(isMobile: boolean) {
  const navigate = useNavigate();
  const location = useLocation();

  return (href: string, options?: { surface?: "dialog" | "page"; replace?: boolean }) => {
    const search = location.search as Record<string, unknown>;
    const inPanel = typeof search[PANEL_KEY] === "string";

    if (isMobile || options?.surface === "page") {
      void navigate({ href, replace: options?.replace });
      return;
    }

    const [pathname, rawQuery = ""] = href.split("?");
    const targetSearch = Object.fromEntries(new URLSearchParams(rawQuery));
    const marker = inPanel ? (location.state as Record<string, unknown>)[MARK_KEY] : ROOT_ENTRY;

    void navigate({
      // 대화상자 내부 이동은 같은 마스킹 이력을 replace해 닫기 시 한 번에 목록으로 복귀
      replace: inPanel || Boolean(options?.replace),
      to: location.pathname,
      search: { ...search, [PANEL_KEY]: href },
      state: { [MARK_KEY]: marker } as never,
      mask: {
        to: pathname,
        search: targetSearch as never,
        state: { [MARK_KEY]: marker } as never,
      },
      resetScroll: false,
    });
  };
}

export function usePanel() {
  const router = useRouter();
  const navigate = useNavigate();
  const location = useLocation();
  const { [PANEL_KEY]: raw, ...rest } = location.search as Record<string, unknown>;
  const href = typeof raw === "string" && raw.startsWith("/") ? raw : undefined;
  const openedHere = (location.state as Record<string, unknown>)[MARK_KEY] === ROOT_ENTRY;

  return {
    href,
    /** 대화상자 닫기: 여기서 열었으면 히스토리 뒤로 복귀, 아니면 패널 쿼리만 제거 */
    close: (fallbackHref?: string) => {
      if (href && openedHere) return router.history.back();
      if (!href && fallbackHref) return void navigate({ href: fallbackHref, replace: true });
      return void navigate({ to: location.pathname, search: rest as never, replace: true });
    },
    /** 크게 보기 또는 저장 완료: 독립 대상 페이지로 replace */
    expand: (nextHref = href) => {
      if (nextHref) void navigate({ href: nextHref, replace: true });
    },
  };
}
```

- 메모리 히스토리로 실행하는 테스트나 플레이그라운드에서도 `window.history`를 직접 만지지 않고 `router.history.back()`을 사용해 동일하게 동작하게 합니다.

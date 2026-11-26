import { useEffect, useRef, useState } from "react";
import { Link, Outlet, createRootRoute, redirect, useRouterState } from "@tanstack/react-router";
import Lenis from "lenis";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { VISIBLE_MENUS, activeMenu, isUnder } from "@/shared/config/site-menus";
import { DesignConfigProvider } from "@/shared/lib/design-config";
import { BrandMark, DesignSettings, SiteFooter, Wordmark } from "@/shared/ui";
import { DocSearch } from "@/widgets/doc-search";

// 이 시간 안에 끝나는 이동에는 진행 막대를 띄우지 않고, 한 번 띄운 막대는 최소 시간만큼 둔다.
const PENDING_BAR_DELAY_MS = 150;
const PENDING_BAR_MIN_MS = 300;

function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true });
    return () => lenis.destroy();
  }, [enabled]);
}

function RoutePendingBar() {
  const isLoading = useRouterState({ select: (state) => state.isLoading });
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    if (isLoading) {
      const timer = window.setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, PENDING_BAR_DELAY_MS);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(
      () => setVisible(false),
      Math.max(0, PENDING_BAR_MIN_MS - (Date.now() - shownAt.current)),
    );
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  if (!visible) return null;
  return (
    <div aria-hidden="true" className="bg-primary fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse" />
  );
}

const LEGACY_PATHS = /^\/(glossary)(\/|$)/;
// 옛 /frontend/engineering 문서 이름 → Reference › Frontend의 묶음/문서
const ENGINEERING_MOVES: Record<string, string> = {
  layers: "structure/layers",
  "code-style": "code-style/naming",
  navigation: "routing/navigation",
  "resource-routes": "routing/resource-routes",
  state: "state/state",
  "data-flow": "state/data-flow",
};
const DETAILS_PATHS = /^(\/frontend)?\/details(\/|$)/;
const DESIGN_SYSTEM_PATHS =
  /^(\/frontend)?\/(components|overview|packages|foundations|layouts)(\/|$)/;

export const Route = createRootRoute({
  // 예전 주소로 들어온 링크를 새 주소로 보낸다.
  beforeLoad: ({ location }) => {
    // 메뉴 기준으로 옮기기 전 주소(ADR 0008): /frontend/engineering/<문서> → /reference/frontend/<묶음>/<문서>,
    // /frontend/design-system/… → /design-system/…
    const engineering = location.pathname.match(
      /^\/frontend\/engineering(?:\/([^/]+))?(\/[^/]+)?\/?$/,
    );
    if (engineering) {
      const [, slug, stack = ""] = engineering;
      const moved =
        slug === "story" || slug === "overview"
          ? "structure/layers"
          : slug === "code-style" && /파생|부수|메모/.test(decodeURIComponent(location.hash))
            ? "code-style/effects"
            : (ENGINEERING_MOVES[slug ?? ""] ?? slug ?? "");
      const hash = location.hash ? `#${location.hash}` : "";
      throw redirect({
        href: `/reference/frontend${moved ? `/${moved}${stack}` : ""}${hash}`,
        replace: true,
      });
    }
    // Frontend Reference를 다섯 묶음으로 나누기 전 주소(#59): 개요는 Blog 글감으로 빠졌고, 코드 규칙은 두 문서로 나뉘었다.
    const reference = location.pathname.match(
      /^\/reference\/frontend\/(overview|code-style\/code-style)(\/[^/]+)?\/?$/,
    );
    if (reference) {
      const [, old, stack = ""] = reference;
      const hash = location.hash ? `#${location.hash}` : "";
      const effects = /파생|부수|메모/.test(decodeURIComponent(location.hash));
      const target =
        old === "overview"
          ? "structure/layers"
          : effects
            ? "code-style/effects"
            : "code-style/naming";
      throw redirect({ href: `/reference/frontend/${target}${stack}${hash}`, replace: true });
    }
    if (/^\/frontend\/design-system(\/|$)/.test(location.pathname)) {
      throw redirect({
        href: location.href.replace(/^\/frontend\/design-system/, "/design-system"),
        replace: true,
      });
    }
    if (/^\/(themes|(frontend\/)?foundations\/color-themes)\/?$/.test(location.pathname)) {
      throw redirect({ href: "/design-system/theme", replace: true });
    }
    // 파운데이션이 content 문서(테마와 색상, 스타일 레시피)로 옮기기 전 주소
    const foundation = location.pathname.match(
      /^(?:\/frontend\/design-system|\/frontend)?\/foundations\/(tokens|recipes)\/?$/,
    );
    if (foundation) {
      const slug = foundation[1] === "tokens" ? "theme" : "recipes";
      throw redirect({ href: `/design-system/${slug}`, replace: true });
    }
    if (/^\/(frontend\/)?getting-started\/?$/.test(location.pathname)) {
      throw redirect({ href: "/design-system/packages", replace: true });
    }
    // 옛 playbook 공간(지움)과 그 앞의 webapp·sdlc 공간 주소. 옮긴 문서는 그 자리로, 나머지는 처음 화면으로 보낸다.
    if (/^\/(playbook|frontend\/agent)(\/|$)/.test(location.pathname)) {
      throw redirect({ href: "/", replace: true });
    }
    const legacy = location.pathname.match(/^\/(webapp|sdlc)(\/[^/]+)?\/?$/);
    if (legacy) {
      const moved: Record<string, string> = {
        frontend: "/reference/frontend",
        backend: "/backend/engineering/overview",
      };
      throw redirect({ href: moved[legacy[2]?.slice(1) ?? ""] ?? "/", replace: true });
    }
    if (/^\/backend\/engineering\/story\/?$/.test(location.pathname)) {
      throw redirect({ href: "/backend/engineering/overview", replace: true });
    }
    // Design System 문서가 /design-system 아래로 모이기 전 주소
    if (DESIGN_SYSTEM_PATHS.test(location.pathname)) {
      const rest = location.href.replace(/^\/frontend/, "");
      throw redirect({ href: `/design-system${rest}`, replace: true });
    }
    // Interaction 메뉴의 예전 이름(Details) 주소
    if (DETAILS_PATHS.test(location.pathname)) {
      const rest = location.href.replace(/^(\/frontend)?\/details/, "");
      throw redirect({ href: `/frontend/interaction${rest}`, replace: true });
    }
    if (LEGACY_PATHS.test(location.pathname)) {
      throw redirect({ href: `/frontend${location.href}`, replace: true });
    }
  },
  component: RootLayout,
});

function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isLanding = pathname === "/";
  useSmoothScroll(!isLanding);

  if (isLanding) {
    return (
      <DesignConfigProvider>
        <Outlet />
      </DesignConfigProvider>
    );
  }

  const current = activeMenu(pathname);
  const subItems = current?.children ?? [];
  const isDocs = ["/frontend", "/reference", "/design-system"].some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isBackend = pathname.startsWith("/backend");
  const hasDocsShell = isBackend || (isDocs && !pathname.startsWith("/frontend/glossary"));

  return (
    <DesignConfigProvider>
      <RoutePendingBar />
      <div className="bg-background text-foreground flex min-h-screen flex-col">
        <header className="border-border/80 bg-background/85 sticky top-0 z-30 border-b backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6">
            {/* Left Brand */}
            <Link
              to="/"
              aria-label="dev.goraebap 처음으로"
              className="flex min-w-0 items-center gap-2.5"
            >
              <span className="bg-primary text-primary-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-md transition-transform hover:scale-105">
                <BrandMark className="size-7" />
              </span>
              <Wordmark className="hidden h-5 w-auto shrink-0 sm:block" />
            </Link>

            {/* Center Primary Nav: 어느 페이지에서나 같은 메뉴 */}
            <nav aria-label="주요 메뉴" className="hidden items-center gap-1 md:flex">
              {VISIBLE_MENUS.map((menu) => (
                <Link
                  key={menu.label}
                  to={menu.to}
                  aria-current={menu === current ? "page" : undefined}
                  className={
                    menu === current
                      ? "bg-secondary text-foreground inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
                      : "text-muted-foreground hover:bg-accent/70 hover:text-foreground inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors"
                  }
                >
                  <SystemIcon name={menu.icon} className="size-4" />
                  <span>{menu.label}</span>
                </Link>
              ))}
            </nav>

            {/* Right Utilities */}
            <div className="flex items-center gap-2.5">
              <DesignSettings />
              <DocSearch />
            </div>
          </div>

          {/* Mobile: 메뉴 줄 */}
          <nav
            aria-label="모바일 주요 메뉴"
            className="border-border/60 flex items-center gap-1 overflow-x-auto border-t px-4 py-1.5 md:hidden"
          >
            {VISIBLE_MENUS.map((menu) => (
              <Link
                key={menu.label}
                to={menu.to}
                aria-current={menu === current ? "page" : undefined}
                className={
                  menu === current
                    ? "bg-secondary text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                    : "text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                }
              >
                <SystemIcon name={menu.icon} className="size-3.5" />
                <span>{menu.label}</span>
              </Link>
            ))}
          </nav>

          {/* 하위 메뉴: 지금 메뉴에 하위 메뉴가 있을 때 */}
          {subItems.length > 0 && (
            <nav
              aria-label={`${current?.label} 하위 메뉴`}
              className="border-border/60 mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto border-t px-4 py-1.5 sm:px-6"
            >
              {subItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  aria-current={isUnder(pathname, item.match) ? "page" : undefined}
                  className={
                    isUnder(pathname, item.match)
                      ? "text-foreground inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium"
                      : "text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </header>

        <div className="flex-1">
          <Outlet />
        </div>

        {!hasDocsShell && <SiteFooter />}
      </div>
    </DesignConfigProvider>
  );
}

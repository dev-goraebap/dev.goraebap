import { useEffect, useRef, useState } from "react";
import { Link, Outlet, createRootRoute, redirect, useRouterState } from "@tanstack/react-router";
import Lenis from "lenis";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { HEADER_MENUS, activeMenu, isUnder } from "@/shared/config/site-menus";
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

const LEGACY_GLOSSARY_PATHS = /^\/(frontend|backend|design-system)\/glossary\/?$/;
// 옛 /frontend/interaction 문서 중 디자인 시스템으로 옮긴 항목. 나머지는 /frontend로 보낸다.
const INTERACTION_MOVES: Record<string, string> = {
  "loading-feedback": "/design-system/loading-feedback",
  "ui-states": "/design-system/ui-states",
  "adaptive-ui": "/design-system/adaptive-ui",
  "ui-size": "/design-system/ui-size",
  scrollbar: "/design-system/scrollbar",
};
const DESIGN_SYSTEM_PATHS =
  /^(\/frontend)?\/(components|overview|packages|foundations|layouts)(\/|$)/;

export const Route = createRootRoute({
  // 예전 주소로 들어온 링크를 새 주소로 보낸다.
  beforeLoad: ({ location }) => {
    // 예전 프론트엔드 주소(/reference/frontend/…, /frontend/engineering/…)는 새 프론트엔드(/frontend)로 보낸다.
    if (/^\/(reference\/frontend|frontend\/engineering)(\/|$)/.test(location.pathname)) {
      throw redirect({ href: "/frontend", replace: true });
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
        frontend: "/frontend",
        backend: "/backend",
      };
      throw redirect({ href: moved[legacy[2]?.slice(1) ?? ""] ?? "/", replace: true });
    }
    // 예전 백엔드 주소(/reference/backend/…, /backend/engineering/…)는 새 백엔드(/backend)로 보낸다.
    if (/^\/(reference\/backend|backend\/engineering)(\/|$)/.test(location.pathname)) {
      throw redirect({ href: "/backend", replace: true });
    }
    // Design System 문서가 /design-system 아래로 모이기 전 주소
    if (DESIGN_SYSTEM_PATHS.test(location.pathname)) {
      const rest = location.href.replace(/^\/frontend/, "");
      throw redirect({ href: `/design-system${rest}`, replace: true });
    }
    // Interaction 메뉴(#58에서 없앰)와 그 예전 이름(Details)의 주소: 디자인 시스템 항목은 새 자리로, 나머지는 /frontend로 보낸다.
    const interaction = location.pathname.match(
      /^(?:\/frontend)?\/(?:interaction|details)(?:\/([^/]+))?(\/[^/]+)?\/?$/,
    );
    if (interaction) {
      const [, slug = "", stack = ""] = interaction;
      const anchor = decodeURIComponent(location.hash);
      const target =
        slug === "page-transition" && /화면-전환|움직임|완료|동작-줄이기/.test(anchor)
          ? "/design-system/motion"
          : INTERACTION_MOVES[slug];
      const hash = location.hash ? `#${location.hash}` : "";
      throw redirect({
        href: target ? `${target}${stack}${hash}` : "/frontend",
        replace: true,
      });
    }
    const legacyGlossary = location.pathname.match(LEGACY_GLOSSARY_PATHS);
    if (legacyGlossary) {
      const domain = legacyGlossary[1];
      const hash = location.hash ? `#${location.hash}` : "";
      throw redirect({
        href: hash ? `/glossary${hash}` : `/glossary?domain=${domain}`,
        replace: true,
      });
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
  const hasDocsShell = ["/frontend", "/backend", "/design-system"].some((prefix) =>
    pathname.startsWith(prefix),
  );

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
              {HEADER_MENUS.map((menu) => (
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
            {HEADER_MENUS.map((menu) => (
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

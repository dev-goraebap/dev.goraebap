import { useEffect, useRef, useState } from "react";
import { Link, Outlet, createRootRoute, redirect, useRouterState } from "@tanstack/react-router";
import Lenis from "lenis";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { activeMenu, activeSpace, type SiteMenu } from "@/shared/config/site-menus";
import { DesignConfigProvider } from "@/shared/lib/design-config";
import { DesignSettings, MobileDocBar, SiteFooter, WorkspaceSwitcher } from "@/shared/ui";
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

const LEGACY_GLOSSARY_PATHS = /^\/(?:webapp\/)?(frontend|backend|design-system)\/glossary\/?$/;
// 옛 /frontend/interaction 문서 중 디자인 시스템으로 옮긴 항목. 나머지는 /webapp/frontend로 보낸다.
const INTERACTION_MOVES: Record<string, string> = {
  "loading-feedback": "/webapp/design-system/loading-feedback",
  "ui-states": "/webapp/design-system/ui-states",
  "adaptive-ui": "/webapp/design-system/adaptive-ui",
  "ui-size": "/webapp/design-system/ui-size",
  scrollbar: "/webapp/design-system/scrollbar",
};
const DESIGN_SYSTEM_PATHS =
  /^(\/frontend)?\/(components|overview|packages|foundations|layouts)(\/|$)/;

export const Route = createRootRoute({
  // 예전 주소로 들어온 링크를 새 주소(/webapp/...)로 보낸다.
  beforeLoad: ({ location }) => {
    const legacyGlossary = location.pathname.match(LEGACY_GLOSSARY_PATHS);
    if (legacyGlossary) {
      const domain = legacyGlossary[1];
      const hash = location.hash ? `#${location.hash}` : "";
      throw redirect({
        href: hash ? `/glossary${hash}` : `/glossary?domain=${domain}`,
        replace: true,
      });
    }
    if (/^\/agents(\/|$)/.test(location.pathname)) {
      throw redirect({
        href: location.href.replace(/^\/agents/, "/webapp"),
        replace: true,
      });
    }
    // 예전 프론트엔드 주소(/reference/frontend/…, /frontend/engineering/…)는 /webapp/frontend로 보낸다.
    if (/^\/(reference\/frontend|frontend\/engineering)(\/|$)/.test(location.pathname)) {
      throw redirect({ href: "/webapp/frontend", replace: true });
    }
    if (/^\/frontend\/design-system(\/|$)/.test(location.pathname)) {
      throw redirect({
        href: location.href.replace(/^\/frontend\/design-system/, "/webapp/design-system"),
        replace: true,
      });
    }
    if (/^\/(themes|(frontend\/)?foundations\/color-themes)\/?$/.test(location.pathname)) {
      throw redirect({ href: "/webapp/design-system/theme", replace: true });
    }
    const foundation = location.pathname.match(
      /^(?:\/frontend\/design-system|\/frontend)?\/foundations\/(tokens|recipes)\/?$/,
    );
    if (foundation) {
      const slug = foundation[1] === "tokens" ? "theme" : "recipes";
      throw redirect({ href: `/webapp/design-system/${slug}`, replace: true });
    }
    if (/^\/(frontend\/)?getting-started\/?$/.test(location.pathname)) {
      throw redirect({ href: "/webapp/design-system/packages", replace: true });
    }
    if (/^\/(playbook|frontend\/agent)(\/|$)/.test(location.pathname)) {
      throw redirect({ href: "/webapp", replace: true });
    }
    const legacy = location.pathname.match(/^\/sdlc(\/[^/]+)?\/?$/);
    if (legacy) {
      const moved: Record<string, string> = {
        frontend: "/webapp/frontend",
        backend: "/webapp/backend",
      };
      throw redirect({ href: moved[legacy[1]?.slice(1) ?? ""] ?? "/webapp", replace: true });
    }
    if (/^\/(reference\/backend|backend\/engineering)(\/|$)/.test(location.pathname)) {
      throw redirect({ href: "/webapp/backend", replace: true });
    }
    if (DESIGN_SYSTEM_PATHS.test(location.pathname)) {
      const rest = location.href.replace(/^\/frontend/, "");
      throw redirect({ href: `/webapp/design-system${rest}`, replace: true });
    }
    const interaction = location.pathname.match(
      /^(?:\/frontend)?\/(?:interaction|details)(?:\/([^/]+))?(\/[^/]+)?\/?$/,
    );
    if (interaction) {
      const [, slug = "", stack = ""] = interaction;
      const anchor = decodeURIComponent(location.hash);
      const target =
        slug === "page-transition" && /화면-전환|움직임|완료|동작-줄이기/.test(anchor)
          ? "/webapp/design-system/motion"
          : INTERACTION_MOVES[slug];
      const hash = location.hash ? `#${location.hash}` : "";
      throw redirect({
        href: target ? `${target}${stack}${hash}` : "/webapp/frontend",
        replace: true,
      });
    }
    // 공간 분리 이전 주소(/frontend/*, /backend/*, /design-system/*)는 /webapp/*로 보낸다.
    if (/^\/(frontend|backend|design-system)(\/|$)/.test(location.pathname)) {
      throw redirect({
        href: `/webapp${location.href}`,
        replace: true,
      });
    }
  },
  component: RootLayout,
});

function MobileSpaceNav({
  spaceLabel,
  menus,
  current,
}: {
  spaceLabel: string;
  menus: readonly SiteMenu[];
  current?: SiteMenu;
}) {
  const navRef = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const update = () => {
      const left = el.scrollLeft > 1;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };

    const raf = window.requestAnimationFrame(update);
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      window.cancelAnimationFrame(raf);
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [menus.length]);

  const maskImage =
    edges.left && edges.right
      ? "linear-gradient(to right, transparent, black 2.25rem, black calc(100% - 2.25rem), transparent)"
      : edges.left
        ? "linear-gradient(to right, transparent, black 2.25rem, black 100%)"
        : edges.right
          ? "linear-gradient(to right, black 0, black calc(100% - 2.25rem), transparent)"
          : undefined;

  return (
    <div className="border-border/60 relative border-t md:hidden">
      <nav
        ref={navRef}
        aria-label={`${spaceLabel} 모바일 메뉴`}
        style={maskImage ? { maskImage, WebkitMaskImage: maskImage } : undefined}
        className="flex items-center gap-1 overflow-x-auto px-4 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {menus.map((menu) => (
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
            {menu.badge && (
              <span className="border-border/80 text-muted-foreground rounded-full border px-1 py-px font-mono text-[0.5625rem] leading-tight">
                {menu.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}

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

  const space = activeSpace(pathname);
  const spaceMenus = space?.menus ?? [];
  const current = activeMenu(pathname);
  const hasDocsShell = pathname === "/webapp" || pathname.startsWith("/webapp/");

  return (
    <DesignConfigProvider>
      <RoutePendingBar />
      <div className="bg-background text-foreground flex min-h-screen flex-col">
        <header className="border-border/80 bg-background/85 sticky top-0 z-30 border-b backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6">
            {/* Left Brand + Space Switcher */}
            <WorkspaceSwitcher />

            {/* Center Primary Nav: 현재 공간의 메뉴 */}
            {spaceMenus.length > 0 && (
              <nav aria-label={`${space?.label ?? ""} 주요 메뉴`} className="hidden items-center gap-1 md:flex">
                {spaceMenus.map((menu) => (
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
                    {menu.badge && (
                      <span className="border-border/80 text-muted-foreground rounded-full border px-1.5 py-px font-mono text-[0.625rem] leading-tight">
                        {menu.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            )}

            {/* Right Utilities */}
            <div className="flex items-center gap-2.5">
              <DesignSettings />
              <DocSearch />
            </div>
          </div>

          {/* Mobile: 현재 공간 메뉴 줄 */}
          {spaceMenus.length > 0 && (
            <MobileSpaceNav
              spaceLabel={space?.label ?? ""}
              menus={spaceMenus}
              current={current}
            />
          )}
        </header>

        <div className="flex-1">
          <Outlet />
        </div>

        {!hasDocsShell && <SiteFooter />}
        <MobileDocBar />
      </div>
    </DesignConfigProvider>
  );
}

import { useEffect, useState } from "react";
import { Link, Outlet, createRootRoute, redirect, useRouterState } from "@tanstack/react-router";
import Lenis from "lenis";
import { SystemIcon, type SystemIconName } from "@goraebap/ui-react/icons";
import { DesignConfigProvider } from "@/shared/lib/design-config";
import { DesignSettings, SiteFooter, WorkspaceSwitcher } from "@/shared/ui";
import { DocSearch } from "@/widgets/doc-search";

const PENDING_BAR_DELAY_MS = 180;

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

  useEffect(() => {
    if (!isLoading) return;
    const timer = window.setTimeout(() => setVisible(true), PENDING_BAR_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      setVisible(false);
    };
  }, [isLoading]);

  if (!isLoading || !visible) return null;
  return (
    <div aria-hidden="true" className="bg-primary fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse" />
  );
}

const LEGACY_PATHS = /^\/(components|overview|foundations|layouts|details|glossary)(\/|$)/;

export const Route = createRootRoute({
  // 워크스페이스 도입 전 주소로 들어온 링크를 새 주소로 보낸다.
  beforeLoad: ({ location }) => {
    if (/^\/(themes|(frontend\/)?foundations\/color-themes)\/?$/.test(location.pathname)) {
      throw redirect({ href: "/frontend/foundations/tokens", replace: true });
    }
    if (/^\/(frontend\/)?getting-started\/?$/.test(location.pathname)) {
      throw redirect({ href: "/frontend/packages", replace: true });
    }
    if (/^\/frontend\/agent\/?$/.test(location.pathname)) {
      throw redirect({ href: "/webapp/agents", replace: true });
    }
    // playbook과 sdlc 시절 주소. 없어진 문서는 webapp 처음으로 보낸다.
    const legacy = location.pathname.match(/^\/(playbook|sdlc)(\/[^/]+)?\/?$/);
    if (legacy) {
      const slug = legacy[2]?.slice(1);
      const kept = ["repository", "source-control", "deployment", "agents"];
      const moved: Record<string, string> = {
        frontend: "/frontend/engineering",
        backend: "/backend/engineering/story",
      };
      const href = !slug
        ? "/webapp"
        : (moved[slug] ?? (kept.includes(slug) ? `/webapp/${slug}` : "/webapp/repository"));
      throw redirect({ href, replace: true });
    }
    if (LEGACY_PATHS.test(location.pathname)) {
      throw redirect({ href: `/frontend${location.href}`, replace: true });
    }
  },
  component: RootLayout,
});

const DESIGN_SYSTEM_PATHS = ["components", "overview", "packages", "foundations", "layouts"];

type NavItem = {
  label: string;
  to?:
    "/frontend/overview" | "/frontend/engineering" | "/frontend/details" | "/backend/engineering";
  icon: SystemIconName;
};

const WORKSPACE_NAV: Record<"frontend" | "backend" | "webapp", NavItem[]> = {
  frontend: [
    { label: "Design System", to: "/frontend/overview", icon: "components" },
    { label: "Engineering", to: "/frontend/engineering", icon: "code" },
    { label: "Details", to: "/frontend/details", icon: "details" },
  ],
  backend: [
    { label: "Engineering", to: "/backend/engineering", icon: "code" },
    { label: "Details", icon: "details" },
  ],
  webapp: [],
};

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

  const isNavActive = (to: string) =>
    to === "/frontend/overview"
      ? DESIGN_SYSTEM_PATHS.some((path) => pathname.startsWith(`/frontend/${path}`))
      : pathname.startsWith(to);

  const isFrontend = pathname.startsWith("/frontend");
  const isBackend = pathname.startsWith("/backend");
  const isWebapp = pathname.startsWith("/webapp");
  const navItems = isFrontend
    ? WORKSPACE_NAV.frontend
    : isBackend
      ? WORKSPACE_NAV.backend
      : isWebapp
        ? WORKSPACE_NAV.webapp
        : [];
  const hasDocsShell =
    isBackend || isWebapp || (isFrontend && !pathname.startsWith("/frontend/glossary"));

  return (
    <DesignConfigProvider>
      <RoutePendingBar />
      <div className="bg-background text-foreground flex min-h-screen flex-col">
        <header className="border-border/80 bg-background/85 sticky top-0 z-30 border-b backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6">
            {/* Left Brand */}
            <WorkspaceSwitcher />

            {/* Center Primary Nav */}
            {navItems.length > 0 && (
              <nav aria-label="주요 메뉴" className="hidden items-center gap-1 md:flex">
                {navItems.map((item) =>
                  item.to ? (
                    <Link
                      key={item.label}
                      to={item.to}
                      activeOptions={{ exact: true }}
                      aria-current={isNavActive(item.to) ? "page" : undefined}
                      className={
                        isNavActive(item.to)
                          ? "bg-secondary text-foreground inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
                          : "text-muted-foreground hover:bg-accent/70 hover:text-foreground inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors"
                      }
                    >
                      <SystemIcon name={item.icon} className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <span
                      key={item.label}
                      aria-disabled="true"
                      title="준비 중"
                      className="text-muted-foreground/60 inline-flex cursor-not-allowed items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm"
                    >
                      <SystemIcon name={item.icon} className="size-4" />
                      <span>{item.label}</span>
                    </span>
                  ),
                )}
              </nav>
            )}

            {/* Right Utilities */}
            <div className="flex items-center gap-2.5">
              <DesignSettings />
              <DocSearch />
            </div>
          </div>

          {/* Mobile Sub-nav */}
          {navItems.length > 0 && (
            <nav
              aria-label="모바일 주요 메뉴"
              className="border-border/60 flex items-center gap-1 overflow-x-auto border-t px-4 py-1.5 md:hidden"
            >
              {navItems.map((item) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    activeOptions={{ exact: true }}
                    aria-current={isNavActive(item.to) ? "page" : undefined}
                    className={
                      isNavActive(item.to)
                        ? "bg-secondary text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                        : "text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                    }
                  >
                    <SystemIcon name={item.icon} className="size-3.5" />
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    key={item.label}
                    aria-disabled="true"
                    className="text-muted-foreground/60 inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                  >
                    <SystemIcon name={item.icon} className="size-3.5" />
                    <span>{item.label}</span>
                  </span>
                ),
              )}
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

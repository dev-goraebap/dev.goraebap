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

const LEGACY_PATHS = /^\/(glossary)(\/|$)/;
const DETAILS_PATHS = /^(\/frontend)?\/details(\/|$)/;
const DESIGN_SYSTEM_PATHS =
  /^(\/frontend)?\/(components|overview|packages|foundations|layouts)(\/|$)/;

export const Route = createRootRoute({
  // 워크스페이스 도입 전 주소로 들어온 링크를 새 주소로 보낸다.
  beforeLoad: ({ location }) => {
    if (/^\/(themes|(frontend\/)?foundations\/color-themes)\/?$/.test(location.pathname)) {
      throw redirect({ href: "/frontend/design-system/foundations/tokens", replace: true });
    }
    if (/^\/(frontend\/)?getting-started\/?$/.test(location.pathname)) {
      throw redirect({ href: "/frontend/design-system/packages", replace: true });
    }
    if (/^\/frontend\/agent\/?$/.test(location.pathname)) {
      throw redirect({ href: "/playbook/agents", replace: true });
    }
    // webapp·sdlc 공간과 예전 playbook 문서 주소. 없어진 문서는 플레이북 목록으로 보낸다.
    const legacy = location.pathname.match(/^\/(webapp|sdlc|playbook)(\/[^/]+)?\/?$/);
    const moved: Record<string, string> = {
      repository: "/playbook/project-setup",
      "source-control": "/playbook/deploy",
      deployment: "/playbook/deploy",
      agents: "/playbook/agents",
      frontend: "/frontend/engineering/overview",
      backend: "/backend/engineering/overview",
    };
    const slug = legacy?.[2]?.slice(1);
    if (legacy && (legacy[1] !== "playbook" || (slug && slug in moved && slug !== "agents"))) {
      const href = slug ? (moved[slug] ?? "/playbook") : "/playbook";
      throw redirect({ href, replace: true });
    }
    const story = location.pathname.match(/^\/(frontend|backend)\/engineering\/story\/?$/);
    if (story) {
      throw redirect({ href: `/${story[1]}/engineering/overview`, replace: true });
    }
    // Design System 문서가 /frontend/design-system 아래로 모이기 전 주소
    if (DESIGN_SYSTEM_PATHS.test(location.pathname)) {
      const rest = location.href.replace(/^\/frontend/, "");
      throw redirect({ href: `/frontend/design-system${rest}`, replace: true });
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

type NavItem = {
  label: string;
  to?:
    | "/frontend/engineering"
    | "/frontend/design-system/overview"
    | "/frontend/interaction"
    | "/backend/engineering";
  icon: SystemIconName;
};

const WORKSPACE_NAV: Record<"frontend" | "backend" | "playbook", NavItem[]> = {
  frontend: [
    { label: "Engineering", to: "/frontend/engineering", icon: "code" },
    { label: "Design System", to: "/frontend/design-system/overview", icon: "components" },
    { label: "Interaction", to: "/frontend/interaction", icon: "details" },
  ],
  backend: [
    { label: "Engineering", to: "/backend/engineering", icon: "code" },
    { label: "Details", icon: "details" },
  ],
  playbook: [],
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
    pathname.startsWith(to === "/frontend/design-system/overview" ? "/frontend/design-system" : to);

  const isFrontend = pathname.startsWith("/frontend");
  const isBackend = pathname.startsWith("/backend");
  const isPlaybook = pathname.startsWith("/playbook");
  const navItems = isFrontend
    ? WORKSPACE_NAV.frontend
    : isBackend
      ? WORKSPACE_NAV.backend
      : isPlaybook
        ? WORKSPACE_NAV.playbook
        : [];
  const hasDocsShell =
    isBackend || isPlaybook || (isFrontend && !pathname.startsWith("/frontend/glossary"));

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

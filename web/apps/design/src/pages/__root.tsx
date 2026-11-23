import { useEffect, useState } from "react";
import { Link, Outlet, createRootRoute, useRouterState } from "@tanstack/react-router";
import Lenis from "lenis";
import { Button } from "@goraebap/ui-react/components/button";
import { SystemIcon, type SystemIconName } from "@goraebap/ui-react/icons";
import { DesignConfigProvider } from "@/shared/lib/design-config";
import { BrandMark, DesignSettings, SiteFooter } from "@/shared/ui";

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

export const Route = createRootRoute({
  component: RootLayout,
});

const LIBRARY_PATHS = ["/components", "/overview", "/getting-started", "/foundations", "/adapters"];
const DOCS_SHELL_PATHS = [...LIBRARY_PATHS, "/layouts", "/details"];

const TOP_NAV: {
  label: string;
  to: "/components" | "/layouts" | "/details";
  icon: SystemIconName;
}[] = [
  { label: "컴포넌트", to: "/components", icon: "components" },
  { label: "레이아웃", to: "/layouts", icon: "layouts" },
  { label: "디테일", to: "/details", icon: "details" },
];

function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isPreview = pathname.startsWith("/preview");
  useSmoothScroll(!isPreview);

  if (isPreview) {
    return (
      <DesignConfigProvider>
        <Outlet />
      </DesignConfigProvider>
    );
  }

  const isNavActive = (to: string) =>
    to === "/components"
      ? LIBRARY_PATHS.some((path) => pathname.startsWith(path))
      : pathname.startsWith(to);

  const hasDocsShell = DOCS_SHELL_PATHS.some((path) => pathname.startsWith(path));

  return (
    <DesignConfigProvider>
      <RoutePendingBar />
      <div className="bg-background text-foreground flex min-h-screen flex-col">
        <header className="border-border/80 bg-background/85 sticky top-0 z-30 border-b backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6">
            {/* Left Brand */}
            <Link
              to="/"
              className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight"
            >
              <span className="bg-primary text-primary-foreground inline-flex size-9 items-center justify-center rounded-md transition-transform group-hover:scale-105">
                <BrandMark className="size-7" />
              </span>
              <span>goraebap/design</span>
            </Link>

            {/* Center Primary Nav */}
            <nav aria-label="주요 메뉴" className="hidden items-center gap-1 md:flex">
              {TOP_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
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
              ))}
            </nav>

            {/* Right Utilities */}
            <div className="flex items-center gap-2.5">
              <DesignSettings />
              <Button
                size="sm"
                shape="pill"
                nativeButton={false}
                render={<Link to="/getting-started" />}
              >
                시작하기
              </Button>
            </div>
          </div>

          {/* Mobile Sub-nav */}
          <nav
            aria-label="모바일 주요 메뉴"
            className="border-border/60 flex items-center gap-1 overflow-x-auto border-t px-4 py-1.5 md:hidden"
          >
            {TOP_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
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
            ))}
          </nav>
        </header>

        <div className="flex-1">
          <Outlet />
        </div>

        {!hasDocsShell && <SiteFooter />}
      </div>
    </DesignConfigProvider>
  );
}

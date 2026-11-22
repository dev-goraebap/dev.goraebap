import { Link, Outlet, createRootRoute, useRouterState } from "@tanstack/react-router";
import { BrandMark, ModeToggle } from "@/shared/ui";

export const Route = createRootRoute({
  component: RootLayout,
});

const LIBRARY_PATHS = ["/components", "/getting-started", "/foundations", "/adapters"];

const TOP_NAV = [
  { label: "컴포넌트", to: "/components" as const },
  { label: "템플릿", to: "/templates" as const },
  { label: "테마", to: "/themes" as const },
];

function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname.startsWith("/preview")) {
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

  return (
    <DesignConfigProvider>
      <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-border/80 bg-background/85 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6">
          {/* Left Brand */}
          <Link
            to="/"
            className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight"
          >
            <span className="bg-primary text-primary-foreground inline-flex size-7 items-center justify-center rounded-lg transition-transform group-hover:scale-105">
              <BrandMark className="size-5.5" />
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
                    ? "bg-secondary text-foreground rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
                    : "text-muted-foreground hover:bg-accent/70 hover:text-foreground rounded-full px-3.5 py-1.5 text-sm transition-colors"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Utilities */}
          <div className="flex items-center gap-2.5">
            <ModeToggle />
            <Button size="sm" shape="pill" render={<Link to="/getting-started" />}>
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
                  ? "bg-secondary text-foreground shrink-0 rounded-full px-3 py-1 text-xs font-medium"
                  : "text-muted-foreground hover:text-foreground shrink-0 rounded-full px-3 py-1 text-xs"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="border-border/80 border-t">
        <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span className="text-foreground font-medium">goraebap/design</span>
          <div className="flex flex-wrap items-center gap-4 font-mono">
            <Link to="/components" className="hover:text-foreground transition-colors">
              컴포넌트
            </Link>
            <Link to="/templates" className="hover:text-foreground transition-colors">
              템플릿
            </Link>
            <Link to="/themes" className="hover:text-foreground transition-colors">
              테마
            </Link>
          </div>
        </div>
      </footer>
    </div>
    </DesignConfigProvider>
  );
}

import { Link, Outlet, createRootRoute, useRouterState } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDocs = pathname.startsWith("/ui");

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-border/80 bg-background/85 sticky top-0 z-20 border-b backdrop-blur-md">
        <div
          className={
            isDocs
              ? "mx-auto flex h-14 max-w-6xl items-center justify-between px-6"
              : "mx-auto flex h-14 max-w-4xl items-center justify-between px-6"
          }
        >
          <Link
            to="/"
            className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight"
          >
            <span className="bg-blog-accent inline-block size-2 rounded-full transition-transform group-hover:scale-125" />
            <span>dev.goraebap</span>
          </Link>
          <div className="flex items-center gap-5">
            <nav aria-label="주요 메뉴" className="flex items-center gap-5 text-sm">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                글
              </Link>
              <Link
                to="/ui"
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                디자인 시스템
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main
        className={
          isDocs
            ? "mx-auto w-full max-w-6xl flex-1 px-6 py-8 sm:py-10"
            : "mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:py-16"
        }
      >
        <Outlet />
      </main>

      <footer className="border-border/80 border-t">
        <div
          className={
            isDocs
              ? "text-muted-foreground mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs sm:flex-row sm:items-center sm:justify-between"
              : "text-muted-foreground mx-auto flex max-w-4xl flex-col gap-2 px-6 py-6 text-xs sm:flex-row sm:items-center sm:justify-between"
          }
        >
          <p>dev.goraebap — 사람과 에이전트가 함께 읽는 개발 기록과 5계층 디자인 시스템</p>
          <p className="font-mono">@goraebap/design-system · @goraebap/ui</p>
        </div>
      </footer>
    </div>
  );
}

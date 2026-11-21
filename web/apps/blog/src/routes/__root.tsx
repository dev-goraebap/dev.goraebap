import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            dev.goraebap
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link
              to="/"
              activeProps={{ className: "text-foreground font-medium" }}
              activeOptions={{ exact: true }}
            >
              글
            </Link>
            <Link
              to="/ui"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              UI
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
}

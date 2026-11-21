import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-border border-b">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-6">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            goraebap accounts
          </Link>
          <span className="text-muted-foreground font-mono text-xs">*.goraebap.xyz</span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
}

import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { ModeToggle } from "@/shared/ui";

export const Route = createRootRoute({
  component: RootLayout,
});

const TOP_NAV = [
  { label: "Docs", to: "/docs" as const },
  { label: "Components", to: "/components" as const },
  { label: "Templates", to: "/templates" as const },
  { label: "Themes", to: "/themes" as const },
];

function RootLayout() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-border/80 bg-background/85 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6">
          {/* Left Brand */}
          <Link
            to="/"
            className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight"
          >
            <span className="bg-primary text-primary-foreground inline-flex size-7 items-center justify-center rounded-lg transition-transform group-hover:scale-105">
              <Layers className="size-4" />
            </span>
            <span>goraebap/design</span>
          </Link>

          {/* Center Primary Nav */}
          <nav aria-label="주요 메뉴" className="hidden items-center gap-1 md:flex">
            {TOP_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-muted-foreground hover:bg-accent/70 hover:text-foreground rounded-full px-3.5 py-1.5 text-sm transition-colors"
                activeProps={{
                  className: "bg-secondary text-foreground font-medium",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Utilities */}
          <div className="flex items-center gap-2.5">
            <ModeToggle />
            <Link
              to="/docs"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center rounded-full px-4 text-xs font-medium transition-colors"
            >
              Get started
            </Link>
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
              className="text-muted-foreground hover:text-foreground shrink-0 rounded-full px-3 py-1 text-xs"
              activeProps={{ className: "bg-secondary text-foreground font-medium" }}
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
          <div className="flex items-center gap-2">
            <span className="text-foreground font-medium">goraebap/design</span>
            <span>·</span>
            <span>Framework-Agnostic 5-Layer Design System</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-mono">
            <Link to="/docs" className="hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link to="/components" className="hover:text-foreground transition-colors">
              Components
            </Link>
            <Link to="/templates" className="hover:text-foreground transition-colors">
              Templates
            </Link>
            <Link to="/themes" className="hover:text-foreground transition-colors">
              Themes
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { COMPONENT_DOCS } from "@/components/ui-docs/component-catalog";

export const Route = createFileRoute("/ui")({
  component: UiDocsLayout,
});

const LAYER_LINKS = [
  { to: "/ui" as const, label: "5계층 개요", exact: true },
  { to: "/ui/tokens" as const, label: "1층 · Design Tokens", exact: false },
  { to: "/ui/recipes" as const, label: "2층 · Style Recipes", exact: false },
  { to: "/ui/primitives" as const, label: "3층 · Headless Primitives", exact: false },
  { to: "/ui/patterns" as const, label: "5층 · Patterns", exact: false },
];

const GROUPS = ["입력 · 동작", "표시 · 구조", "오버레이 · 탐색"] as const;

function UiDocsLayout() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      {/* Mobile horizontal quick nav */}
      <nav aria-label="디자인 시스템 메뉴" className="flex gap-1.5 overflow-x-auto pb-2 lg:hidden">
        {LAYER_LINKS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.exact }}
            className="border-border text-muted-foreground shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium"
            activeProps={{ className: "bg-primary text-primary-foreground border-primary" }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Desktop sticky sidebar (shadcn docs style) */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-22 max-h-[calc(100vh-6rem)] space-y-6 overflow-y-auto pr-2">
          <div className="space-y-1">
            <p className="text-muted-foreground px-2.5 pb-1 font-mono text-[11px] font-medium">
              ARCHITECTURE
            </p>
            {LAYER_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className="text-muted-foreground hover:bg-accent hover:text-foreground block rounded-md px-2.5 py-1.5 text-xs transition-colors"
                activeProps={{ className: "bg-secondary text-foreground font-medium" }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="space-y-4">
            <p className="text-muted-foreground px-2.5 font-mono text-[11px] font-medium">
              4층 · COMPONENTS ({COMPONENT_DOCS.length})
            </p>
            {GROUPS.map((group) => (
              <div key={group} className="space-y-0.5">
                <p className="text-muted-foreground/80 px-2.5 pb-1 text-[11px] font-medium">
                  {group}
                </p>
                {COMPONENT_DOCS.filter((c) => c.group === group).map((comp) => (
                  <Link
                    key={comp.slug}
                    to="/ui/components/$slug"
                    params={{ slug: comp.slug }}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground block rounded-md px-2.5 py-1 text-xs transition-colors"
                    activeProps={{ className: "bg-secondary text-foreground font-medium" }}
                  >
                    {comp.name}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main doc content */}
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

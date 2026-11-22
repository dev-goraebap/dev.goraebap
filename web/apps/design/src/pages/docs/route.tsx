import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

const DOC_GROUPS = [
  {
    title: "Getting Started",
    items: [{ label: "5계층 개요", to: "/docs" as const, exact: true }],
  },
  {
    title: "Foundations",
    items: [
      { label: "01. Design Tokens", to: "/docs/tokens" as const, exact: false },
      { label: "02. Style Recipes", to: "/docs/recipes" as const, exact: false },
    ],
  },
  {
    title: "Adapters",
    items: [{ label: "03. Pure HTML & Primitives", to: "/docs/primitives" as const, exact: false }],
  },
];

function DocsLayout() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10 lg:flex-row">
      {/* Left Sticky Sidebar */}
      <aside aria-label="문서 탐색" className="w-full shrink-0 lg:w-56">
        <div className="space-y-6 lg:sticky lg:top-24">
          {DOC_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <p className="text-muted-foreground px-3 font-mono text-[11px] font-medium tracking-wide uppercase">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      activeOptions={{ exact: item.exact }}
                      className="text-muted-foreground hover:bg-accent/60 hover:text-foreground block rounded-full px-3 py-1.5 text-sm transition-colors"
                      activeProps={{
                        className: "bg-secondary text-foreground font-medium",
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

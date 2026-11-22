import { useState } from "react";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { COMPONENT_CATEGORIES, COMPONENT_DOCS } from "@/entities/component-doc";

export const Route = createFileRoute("/components")({
  component: ComponentsLayout,
});

function ComponentsLayout() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();

  const filtered = normalized
    ? COMPONENT_DOCS.filter(
        (item) =>
          item.name.toLowerCase().includes(normalized) ||
          item.slug.toLowerCase().includes(normalized) ||
          item.summary.toLowerCase().includes(normalized),
      )
    : COMPONENT_DOCS;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10 lg:flex-row">
      {/* Left Sticky Component Browser Sidebar */}
      <aside aria-label="컴포넌트 목록" className="w-full shrink-0 lg:w-60">
        <div className="space-y-5 lg:sticky lg:top-24">
          {/* Search Input */}
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search components..."
              aria-label="컴포넌트 검색"
              className="border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-full border pr-3 pl-9 text-xs outline-none focus-visible:ring-2"
            />
          </div>

          <nav className="space-y-5">
            <div>
              <Link
                to="/components"
                activeOptions={{ exact: true }}
                className="text-muted-foreground hover:bg-accent/60 hover:text-foreground block rounded-full px-3 py-1.5 text-sm transition-colors"
                activeProps={{
                  className: "bg-secondary text-foreground font-medium",
                }}
              >
                Overview
              </Link>
            </div>

            {COMPONENT_CATEGORIES.map((category) => {
              const items = filtered.filter((doc) => doc.category === category);
              if (items.length === 0) return null;
              return (
                <div key={category} className="space-y-1">
                  <p className="text-muted-foreground px-3 font-mono text-[11px] font-medium tracking-wide uppercase">
                    {category}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((item) => (
                      <li key={item.slug}>
                        <Link
                          to="/components/$slug"
                          params={{ slug: item.slug }}
                          className="text-muted-foreground hover:bg-accent/60 hover:text-foreground flex items-center justify-between rounded-full px-3 py-1.5 text-sm transition-colors"
                          activeProps={{
                            className: "bg-secondary text-foreground font-medium",
                          }}
                        >
                          <span>{item.name}</span>
                          {item.pureHtmlLevel === "100% Native HTML" && (
                            <span className="text-muted-foreground/70 font-mono text-[10px]">
                              HTML
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <p className="text-muted-foreground px-3 text-xs">
                &ldquo;{query}&rdquo;에 해당하는 컴포넌트가 없습니다.
              </p>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

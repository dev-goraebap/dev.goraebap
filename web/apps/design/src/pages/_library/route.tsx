import { useState } from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { COMPONENT_DOCS } from "@/entities/component-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/_library")({
  component: LibraryLayout,
});

const GUIDE_GROUPS: DocsNavGroup[] = [
  {
    title: "Getting Started",
    items: [{ label: "시작하기", href: "/getting-started" }],
  },
  {
    title: "Foundations",
    items: [
      { label: "Design Tokens", href: "/foundations/tokens" },
      { label: "Style Recipes", href: "/foundations/recipes" },
    ],
  },
  {
    title: "Adapters",
    items: [{ label: "Pure HTML & Primitives", href: "/adapters/primitives" }],
  },
];

function LibraryLayout() {
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

  const componentGroup: DocsNavGroup = {
    title: "Components",
    items: [
      ...(normalized ? [] : [{ label: "Overview", href: "/components" }]),
      ...filtered.map((item) => ({ label: item.name, href: `/components/${item.slug}` })),
    ],
  };

  return (
    <DocsShell
      label="문서 탐색"
      groups={normalized ? [componentGroup] : [...GUIDE_GROUPS, componentGroup]}
      navHeader={
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
      }
      navFooter={
        normalized && filtered.length === 0 ? (
          <p className="text-muted-foreground px-3 text-xs">
            &ldquo;{query}&rdquo;에 해당하는 컴포넌트가 없습니다.
          </p>
        ) : undefined
      }
    >
      <Outlet />
    </DocsShell>
  );
}

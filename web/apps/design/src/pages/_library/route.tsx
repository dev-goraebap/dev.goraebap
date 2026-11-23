import { useState } from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Input } from "@goraebap/ui-react/components/input";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { COMPONENT_CATEGORIES, COMPONENT_DOCS } from "@/entities/component-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/_library")({
  component: LibraryLayout,
});

const GUIDE_GROUPS: DocsNavGroup[] = [
  {
    title: "가이드",
    items: [
      { label: "개요", href: "/overview", icon: "book" },
      { label: "시작하기", href: "/getting-started", icon: "rocket" },
    ],
  },
  {
    title: "파운데이션",
    items: [
      { label: "디자인 토큰", href: "/foundations/tokens", icon: "swatch" },
      { label: "스타일 레시피", href: "/foundations/recipes", icon: "code" },
    ],
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

  const toNavItem = (item: (typeof COMPONENT_DOCS)[number]) => ({
    label: item.name,
    href: `/components/${item.slug}`,
  });

  const componentGroup: DocsNavGroup = {
    title: "컴포넌트",
    items: normalized
      ? filtered.map(toNavItem)
      : [
          { label: "개요", href: "/components", icon: "overview" },
          ...COMPONENT_CATEGORIES.map((category) => ({
            label: category,
            defaultOpen: true,
            children: COMPONENT_DOCS.filter((item) => item.category === category).map(toNavItem),
          })),
        ],
  };

  return (
    <DocsShell
      label="문서 탐색"
      groups={normalized ? [componentGroup] : [...GUIDE_GROUPS, componentGroup]}
      navHeader={
        <div className="relative">
          <SystemIcon
            name="search"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="컴포넌트 검색"
            aria-label="컴포넌트 검색"
            className="bg-card rounded-full pl-9 text-xs"
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

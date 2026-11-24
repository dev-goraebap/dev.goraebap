import { useState } from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Input } from "@goraebap/ui-react/components/input";
import { SystemIcon, type SystemIconName } from "@goraebap/ui-react/icons";
import { COMPONENT_CATEGORIES, COMPONENT_DOCS } from "@/entities/component-doc";
import { LAYOUT_DOCS } from "@/entities/layout-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/frontend/_library")({
  component: LibraryLayout,
});

const GUIDE_GROUPS: DocsNavGroup[] = [
  {
    title: "가이드",
    items: [
      { label: "개요", href: "/frontend/overview", icon: "book" },
      { label: "시작하기", href: "/frontend/getting-started", icon: "rocket" },
    ],
  },
  {
    title: "파운데이션",
    items: [
      { label: "디자인 토큰", href: "/frontend/foundations/tokens", icon: "swatch" },
      { label: "색상 테마", href: "/frontend/foundations/color-themes", icon: "palette" },
      { label: "스타일 레시피", href: "/frontend/foundations/recipes", icon: "code" },
    ],
  },
];

const SHELL_ICONS: Record<string, SystemIconName> = {
  "app-shell": "workspace",
  "sidebar-content": "book",
  "single-column": "file",
  landing: "details",
};

const LAYOUT_GROUP: DocsNavGroup = {
  title: "레이아웃",
  items: [
    { label: "개요", href: "/frontend/layouts", icon: "overview" },
    ...LAYOUT_DOCS.filter((item) => item.level === "shell").map((item) => ({
      label: item.name,
      href: `/frontend/layouts/${item.id}`,
      icon: SHELL_ICONS[item.id],
      ...(item.id === "app-shell"
        ? {
            defaultOpen: true,
            children: LAYOUT_DOCS.filter((sub) => sub.level === "content").map((sub) => ({
              label: sub.name,
              href: `/frontend/layouts/${sub.id}`,
            })),
          }
        : {}),
    })),
  ],
};

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
    href: `/frontend/components/${item.slug}`,
  });

  const componentGroup: DocsNavGroup = {
    title: "컴포넌트",
    items: normalized
      ? filtered.map(toNavItem)
      : [
          { label: "개요", href: "/frontend/components", icon: "overview" },
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
      groups={normalized ? [componentGroup] : [...GUIDE_GROUPS, componentGroup, LAYOUT_GROUP]}
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

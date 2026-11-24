import { Outlet, createFileRoute } from "@tanstack/react-router";
import type { SystemIconName } from "@goraebap/ui-react/icons";
import { COMPONENT_CATEGORIES, COMPONENT_DOCS } from "@/entities/component-doc";
import { LAYOUT_DOCS } from "@/entities/layout-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/frontend/_library")({
  component: LibraryLayout,
});

const GUIDE_GROUPS: DocsNavGroup[] = [
  {
    title: "디자인 시스템",
    items: [{ label: "개요", href: "/frontend/overview", icon: "book" }],
  },
  {
    title: "파운데이션",
    items: [
      { label: "디자인 토큰", href: "/frontend/foundations/tokens", icon: "swatch" },
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
            children: LAYOUT_DOCS.filter((sub) => sub.level === "content").map((sub) => ({
              label: sub.name,
              href: `/frontend/layouts/${sub.id}`,
            })),
          }
        : {}),
    })),
  ],
};

const COMPONENT_GROUP: DocsNavGroup = {
  title: "컴포넌트",
  items: [
    { label: "개요", href: "/frontend/components", icon: "overview" },
    ...COMPONENT_CATEGORIES.map((category) => ({
      label: category,
      children: COMPONENT_DOCS.filter((item) => item.category === category).map((item) => ({
        label: item.name,
        href: `/frontend/components/${item.slug}`,
      })),
    })),
  ],
};

function LibraryLayout() {
  return (
    <DocsShell label="문서 탐색" groups={[...GUIDE_GROUPS, COMPONENT_GROUP, LAYOUT_GROUP]}>
      <Outlet />
    </DocsShell>
  );
}

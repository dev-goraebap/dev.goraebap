import { Outlet, createFileRoute } from "@tanstack/react-router";
import type { SystemIconName } from "@goraebap/ui-react/icons";
import { COMPONENT_CATEGORIES, COMPONENT_DOCS } from "@/entities/component-doc";
import { LAYOUT_DOCS } from "@/entities/layout-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/frontend/design-system")({
  component: LibraryLayout,
});

const GUIDE_GROUPS: DocsNavGroup[] = [
  {
    items: [
      { label: "개요", href: "/frontend/design-system/overview", icon: "book" },
      { label: "패키지 연결", href: "/frontend/design-system/packages", icon: "code" },
    ],
  },
  {
    title: "파운데이션",
    items: [
      { label: "디자인 토큰", href: "/frontend/design-system/foundations/tokens", icon: "swatch" },
      { label: "스타일 레시피", href: "/frontend/design-system/foundations/recipes", icon: "code" },
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
    { label: "모든 레이아웃", href: "/frontend/design-system/layouts", icon: "overview" },
    ...LAYOUT_DOCS.filter((item) => item.level === "shell").map((item) => ({
      label: item.name,
      href: `/frontend/design-system/layouts/${item.id}`,
      icon: SHELL_ICONS[item.id],
      ...(item.id === "app-shell"
        ? {
            children: LAYOUT_DOCS.filter((sub) => sub.level === "content").map((sub) => ({
              label: sub.name,
              href: `/frontend/design-system/layouts/${sub.id}`,
            })),
          }
        : {}),
    })),
  ],
};

const COMPONENT_GROUP: DocsNavGroup = {
  title: "컴포넌트",
  items: [
    { label: "모든 컴포넌트", href: "/frontend/design-system/components", icon: "overview" },
    ...COMPONENT_CATEGORIES.map((category) => ({
      label: category,
      children: COMPONENT_DOCS.filter((item) => item.category === category).map((item) => ({
        label: item.name,
        href: `/frontend/design-system/components/${item.slug}`,
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

import { Outlet, createFileRoute } from "@tanstack/react-router";
import type { SystemIconName } from "@goraebap/ui-react/icons";
import { LAYOUT_DOCS } from "@/entities/layout-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/layouts")({
  component: LayoutsLayout,
});

const SHELL_DOCS = LAYOUT_DOCS.filter((item) => item.level === "shell");
const MAIN_DOCS = LAYOUT_DOCS.filter((item) => item.level === "content");

const SHELL_ICONS: Record<string, SystemIconName> = {
  "app-shell": "workspace",
  "sidebar-content": "book",
  "single-column": "file",
  landing: "details",
};

const LAYOUT_GROUPS: DocsNavGroup[] = [
  { items: [{ label: "개요", href: "/layouts", icon: "overview" }] },
  {
    title: "레이아웃",
    items: SHELL_DOCS.map((item) => ({
      label: item.name,
      href: `/layouts/${item.id}`,
      icon: SHELL_ICONS[item.id],
      ...(item.id === "app-shell"
        ? {
            defaultOpen: true,
            children: MAIN_DOCS.map((sub) => ({
              label: sub.name,
              href: `/layouts/${sub.id}`,
            })),
          }
        : {}),
    })),
  },
];

function LayoutsLayout() {
  return (
    <DocsShell label="레이아웃 탐색" groups={LAYOUT_GROUPS}>
      <Outlet />
    </DocsShell>
  );
}

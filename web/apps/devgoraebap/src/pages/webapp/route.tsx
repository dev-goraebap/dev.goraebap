import { Outlet, createFileRoute } from "@tanstack/react-router";
import { WEBAPP_GROUPS } from "@/entities/webapp-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/webapp")({
  component: WebappLayout,
});

const WEBAPP_NAV: DocsNavGroup[] = [
  ...WEBAPP_GROUPS.map((group) => ({
    title: group.title,
    items: group.docs.map((doc) => ({
      label: doc.title,
      href: `/webapp/${doc.slug}`,
      icon: doc.icon,
    })),
  })),
  {
    title: "Agents",
    items: [{ label: "webapp 플러그인", href: "/webapp/agents", icon: "rocket" }],
  },
];

function WebappLayout() {
  return (
    <DocsShell label="Webapp 탐색" groups={WEBAPP_NAV}>
      <Outlet />
    </DocsShell>
  );
}

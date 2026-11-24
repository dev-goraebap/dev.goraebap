import { Outlet, createFileRoute } from "@tanstack/react-router";
import { BACKEND_ENGINEERING_GROUPS } from "@/entities/webapp-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/backend/engineering")({
  component: BackendEngineeringLayout,
});

const ENGINEERING_NAV: DocsNavGroup[] = BACKEND_ENGINEERING_GROUPS.map((group) => ({
  title: group.title || undefined,
  items: group.docs.map((doc) => ({
    label: doc.title,
    href: `/backend/engineering/${doc.slug}`,
    icon: doc.icon,
  })),
}));

function BackendEngineeringLayout() {
  return (
    <DocsShell label="Backend Engineering 탐색" groups={ENGINEERING_NAV}>
      <Outlet />
    </DocsShell>
  );
}

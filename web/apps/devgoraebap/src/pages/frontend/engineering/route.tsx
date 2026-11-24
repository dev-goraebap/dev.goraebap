import { Outlet, createFileRoute } from "@tanstack/react-router";
import { FRONTEND_ENGINEERING_GROUPS } from "@/entities/webapp-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/frontend/engineering")({
  component: FrontendEngineeringLayout,
});

const ENGINEERING_NAV: DocsNavGroup[] = FRONTEND_ENGINEERING_GROUPS.map((group) => ({
  title: group.title || undefined,
  items: group.docs.map((doc) => ({
    label: doc.title,
    href: `/frontend/engineering/${doc.slug}`,
    icon: doc.icon,
  })),
}));

function FrontendEngineeringLayout() {
  return (
    <DocsShell label="Frontend Engineering 탐색" groups={ENGINEERING_NAV}>
      <Outlet />
    </DocsShell>
  );
}

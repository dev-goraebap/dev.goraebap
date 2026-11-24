import { Outlet, createFileRoute } from "@tanstack/react-router";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/frontend/engineering")({
  component: EngineeringLayout,
});

const ENGINEERING_NAV: DocsNavGroup[] = [
  {
    title: "Engineering",
    items: [{ label: "개발 이야기", href: "/frontend/engineering", icon: "book" }],
  },
];

function EngineeringLayout() {
  return (
    <DocsShell label="Frontend Engineering 탐색" groups={ENGINEERING_NAV}>
      <Outlet />
    </DocsShell>
  );
}

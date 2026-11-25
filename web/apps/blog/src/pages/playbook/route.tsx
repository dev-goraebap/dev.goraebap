import { Outlet, createFileRoute } from "@tanstack/react-router";
import { PLAYBOOKS } from "@/entities/playbook";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/playbook")({
  component: PlaybookLayout,
});

const toItem = (playbook: (typeof PLAYBOOKS)[number]) => ({
  label: playbook.title,
  href: `/playbook/${playbook.slug}`,
  icon: playbook.icon,
});

const PLAYBOOK_NAV: DocsNavGroup[] = [
  { items: [{ label: "개요", href: "/playbook", icon: "overview" }] },
  { items: PLAYBOOKS.map(toItem) },
  {
    title: "Agents",
    items: [{ label: "webapp 플러그인", href: "/playbook/agents", icon: "rocket" }],
  },
];

function PlaybookLayout() {
  return (
    <DocsShell label="Playbook 탐색" groups={PLAYBOOK_NAV}>
      <Outlet />
    </DocsShell>
  );
}

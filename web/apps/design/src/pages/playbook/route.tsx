import { Outlet, createFileRoute } from "@tanstack/react-router";
import { PLAYBOOK_GROUPS } from "@/entities/playbook-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/playbook")({
  component: PlaybookLayout,
});

const PLAYBOOK_NAV: DocsNavGroup[] = PLAYBOOK_GROUPS.map((group) => ({
  title: group.title,
  items: group.docs.map((doc) => ({
    label: doc.title,
    href: `/playbook/${doc.slug}`,
    icon: doc.icon,
  })),
}));

function PlaybookLayout() {
  return (
    <DocsShell label="Playbook 탐색" groups={PLAYBOOK_NAV}>
      <Outlet />
    </DocsShell>
  );
}

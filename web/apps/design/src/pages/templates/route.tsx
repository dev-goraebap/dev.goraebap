import { Outlet, createFileRoute } from "@tanstack/react-router";
import { TEMPLATE_DOCS } from "@/entities/template-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/templates")({
  component: TemplatesLayout,
});

const TEMPLATE_GROUPS: DocsNavGroup[] = [
  {
    title: "Templates",
    items: [
      { label: "Overview", href: "/templates" },
      ...TEMPLATE_DOCS.map((item) => ({ label: item.name, href: `/templates/${item.id}` })),
    ],
  },
];

function TemplatesLayout() {
  return (
    <DocsShell label="템플릿 탐색" groups={TEMPLATE_GROUPS}>
      <Outlet />
    </DocsShell>
  );
}

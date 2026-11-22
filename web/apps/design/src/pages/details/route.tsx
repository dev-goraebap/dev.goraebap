import { Outlet, createFileRoute } from "@tanstack/react-router";
import type { SystemIconName } from "@goraebap/ui-react/icons";
import { DETAIL_DOCS } from "@/entities/detail-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/details")({
  component: DetailsLayout,
});

const DETAIL_ICONS: Record<string, SystemIconName> = {
  scrollbar: "scroll",
  "page-transition": "transition",
  "initial-load": "rocket",
  "adaptive-ui": "mobile",
  "route-masking": "route",
};

const DETAIL_GROUPS: DocsNavGroup[] = [
  {
    title: "디테일",
    items: [
      { label: "개요", href: "/details", icon: "overview" },
      ...DETAIL_DOCS.map((item) => ({
        label: item.title,
        href: `/details/${item.slug}`,
        icon: DETAIL_ICONS[item.slug],
      })),
    ],
  },
];

function DetailsLayout() {
  return (
    <DocsShell label="디테일 탐색" groups={DETAIL_GROUPS}>
      <Outlet />
    </DocsShell>
  );
}

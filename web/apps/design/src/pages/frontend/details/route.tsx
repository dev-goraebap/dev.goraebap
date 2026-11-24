import { Outlet, createFileRoute } from "@tanstack/react-router";
import type { SystemIconName } from "@goraebap/ui-react/icons";
import { DETAIL_DOCS } from "@/entities/detail-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/frontend/details")({
  component: DetailsLayout,
});

const DETAIL_ICONS: Record<string, SystemIconName> = {
  scrollbar: "scroll",
  "page-transition": "transition",
  "initial-load": "rocket",
  "adaptive-ui": "mobile",
  "ui-size": "font",
  "ui-states": "eye",
  "loading-feedback": "reset",
  "route-masking": "route",
};

const DETAIL_GROUPS: DocsNavGroup[] = [
  {
    title: "Details",
    items: [
      { label: "개요", href: "/frontend/details", icon: "overview" },
      ...DETAIL_DOCS.map((item) => ({
        label: item.title,
        href: `/frontend/details/${item.slug}`,
        icon: DETAIL_ICONS[item.slug],
      })),
    ],
  },
];

function DetailsLayout() {
  return (
    <DocsShell label="Details 탐색" groups={DETAIL_GROUPS}>
      <Outlet />
    </DocsShell>
  );
}

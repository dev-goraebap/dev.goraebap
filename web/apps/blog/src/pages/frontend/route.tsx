import { Outlet, createFileRoute } from "@tanstack/react-router";
import { diataxisNavGroups } from "@/entities/diataxis-doc";
import { DocsShell, SidebarSectionTabs, type SidebarSectionTab } from "@/shared/ui";

export const Route = createFileRoute("/frontend")({
  component: FrontendLayout,
});

const FRONTEND_TABS: SidebarSectionTab[] = [
  { label: "엔지니어링", to: "/frontend", active: true },
  { label: "디자인 시스템", to: "/design-system/overview", active: false, badge: "Beta" },
];

function FrontendLayout() {
  return (
    <DocsShell
      label="프론트엔드 탐색"
      groups={diataxisNavGroups("frontend")}
      stickyHeader={<SidebarSectionTabs label="프론트엔드 영역" items={FRONTEND_TABS} />}
    >
      <Outlet />
    </DocsShell>
  );
}

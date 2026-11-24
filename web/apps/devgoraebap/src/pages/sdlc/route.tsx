import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { SDLC_GROUPS } from "@/entities/sdlc-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/sdlc")({
  component: SdlcLayout,
});

const SDLC_NAV: DocsNavGroup[] = SDLC_GROUPS.map((group) => ({
  title: group.title,
  items: group.docs.map((doc) => ({
    label: doc.title,
    href: `/sdlc/${doc.slug}`,
    icon: doc.icon,
  })),
}));

function SdlcLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  // Agents는 문서 목록이 아니라 따로 읽는 한 페이지라 사이드바 없이 보여 준다.
  if (pathname.startsWith("/sdlc/agents")) return <Outlet />;

  return (
    <DocsShell label="SDLC 탐색" groups={SDLC_NAV}>
      <Outlet />
    </DocsShell>
  );
}

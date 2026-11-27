import { Outlet, createFileRoute } from "@tanstack/react-router";
import { diataxisNavGroups } from "@/entities/diataxis-doc";
import { DocsShell } from "@/shared/ui";

export const Route = createFileRoute("/frontend")({
  component: FrontendLayout,
});

function FrontendLayout() {
  return (
    <DocsShell label="프론트엔드 탐색" groups={diataxisNavGroups("frontend")}>
      <Outlet />
    </DocsShell>
  );
}

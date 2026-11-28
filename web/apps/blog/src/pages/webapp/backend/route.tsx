import { Outlet, createFileRoute } from "@tanstack/react-router";
import { diataxisNavGroups } from "@/entities/diataxis-doc";
import { DocsShell } from "@/shared/ui";

export const Route = createFileRoute("/webapp/backend")({
  component: BackendLayout,
});

function BackendLayout() {
  return (
    <DocsShell label="백엔드 탐색" groups={diataxisNavGroups("backend")}>
      <Outlet />
    </DocsShell>
  );
}

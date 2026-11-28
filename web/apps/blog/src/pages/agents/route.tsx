import { Outlet, createFileRoute } from "@tanstack/react-router";
import { diataxisNavGroups } from "@/entities/diataxis-doc";
import { DocsShell } from "@/shared/ui";

export const Route = createFileRoute("/agents")({
  component: AgentsLayout,
});

function AgentsLayout() {
  return (
    <DocsShell label="Agents 탐색" groups={diataxisNavGroups("agents")}>
      <Outlet />
    </DocsShell>
  );
}

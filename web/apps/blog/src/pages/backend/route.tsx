import { Outlet, createFileRoute } from "@tanstack/react-router";
import { backendNavGroups } from "@/entities/backend-doc";
import { DocsShell } from "@/shared/ui";

export const Route = createFileRoute("/backend")({
  component: BackendLayout,
});

function BackendLayout() {
  return (
    <DocsShell label="백엔드 탐색" groups={backendNavGroups()}>
      <Outlet />
    </DocsShell>
  );
}

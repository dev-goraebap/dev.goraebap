import { createFileRoute } from "@tanstack/react-router";
import { ContentMenuShell } from "@/entities/content-doc";

export const Route = createFileRoute("/frontend/engineering")({
  component: FrontendEngineeringLayout,
});

function FrontendEngineeringLayout() {
  return <ContentMenuShell menu="frontend/engineering" label="Frontend Engineering 탐색" />;
}

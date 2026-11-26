import { createFileRoute } from "@tanstack/react-router";
import { ContentMenuShell } from "@/entities/content-doc";

export const Route = createFileRoute("/frontend/interaction")({
  component: FrontendInteractionLayout,
});

function FrontendInteractionLayout() {
  return <ContentMenuShell menu="frontend/interaction" label="Interaction 탐색" />;
}

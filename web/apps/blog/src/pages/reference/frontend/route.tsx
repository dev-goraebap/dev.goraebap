import { createFileRoute } from "@tanstack/react-router";
import { ContentSectionShell } from "@/entities/content-doc";

export const Route = createFileRoute("/reference/frontend")({
  component: ReferenceFrontendLayout,
});

function ReferenceFrontendLayout() {
  return <ContentSectionShell root="reference/frontend" label="Frontend Reference 탐색" />;
}

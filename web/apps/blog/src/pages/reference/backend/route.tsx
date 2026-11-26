import { createFileRoute } from "@tanstack/react-router";
import { ContentSectionShell } from "@/entities/content-doc";

export const Route = createFileRoute("/reference/backend")({
  component: ReferenceBackendLayout,
});

function ReferenceBackendLayout() {
  return <ContentSectionShell root="reference/backend" label="Backend Reference 탐색" />;
}

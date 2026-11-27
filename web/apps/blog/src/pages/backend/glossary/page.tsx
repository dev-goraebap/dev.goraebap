import { createFileRoute } from "@tanstack/react-router";
import { DiataxisGlossaryView } from "@/entities/diataxis-doc";

export const Route = createFileRoute("/backend/glossary/")({
  component: BackendGlossaryPage,
});

function BackendGlossaryPage() {
  return <DiataxisGlossaryView space="backend" />;
}

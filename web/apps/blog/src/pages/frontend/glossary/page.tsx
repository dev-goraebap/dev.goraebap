import { createFileRoute } from "@tanstack/react-router";
import { DiataxisGlossaryView } from "@/entities/diataxis-doc";

export const Route = createFileRoute("/frontend/glossary/")({
  component: FrontendGlossaryPage,
});

function FrontendGlossaryPage() {
  return <DiataxisGlossaryView space="frontend" />;
}

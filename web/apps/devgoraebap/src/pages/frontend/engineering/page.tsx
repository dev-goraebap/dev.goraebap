import { createFileRoute } from "@tanstack/react-router";
import { DocArticle, ENGINEERING_STORIES } from "@/entities/webapp-doc";

export const Route = createFileRoute("/frontend/engineering/")({
  component: () => <DocArticle doc={ENGINEERING_STORIES.frontend} />,
});

import { createFileRoute } from "@tanstack/react-router";
import { ContentDocView } from "@/entities/content-doc";
import { skillPageHref } from "../../../lib/skill-pages";

export const Route = createFileRoute("/frontend/engineering/$slug/$stack/")({
  component: FrontendEngineeringPage,
});

function FrontendEngineeringPage() {
  const { slug, stack } = Route.useParams();
  return (
    <ContentDocView
      menu="frontend/engineering"
      slug={slug}
      stack={stack}
      skillHref={skillPageHref}
      back={{ href: "/frontend/engineering", label: "Engineering 처음으로 돌아가기" }}
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { ContentDocView } from "@/entities/content-doc";
import { skillPageHref } from "@/pages/lib/skill-pages";

export const Route = createFileRoute("/frontend/interaction/$slug/$stack/")({
  component: FrontendInteractionPage,
});

function FrontendInteractionPage() {
  const { slug, stack } = Route.useParams();
  return (
    <ContentDocView
      menu="frontend/interaction"
      slug={slug}
      stack={stack}
      skillHref={skillPageHref}
      back={{ href: "/frontend/interaction", label: "Interaction 처음으로 돌아가기" }}
    />
  );
}

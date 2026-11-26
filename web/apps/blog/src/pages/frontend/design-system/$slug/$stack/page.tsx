import { createFileRoute } from "@tanstack/react-router";
import { ContentDocView } from "@/entities/content-doc";
import { skillPageHref } from "../../../lib/skill-pages";

export const Route = createFileRoute("/frontend/design-system/$slug/$stack/")({
  component: FrontendDesignSystemPage,
});

function FrontendDesignSystemPage() {
  const { slug, stack } = Route.useParams();
  return (
    <ContentDocView
      menu="frontend/design-system"
      slug={slug}
      stack={stack}
      skillHref={skillPageHref}
      back={{ href: "/frontend/design-system/overview", label: "디자인 시스템 처음으로 돌아가기" }}
    />
  );
}

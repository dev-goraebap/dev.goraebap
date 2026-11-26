import { createFileRoute } from "@tanstack/react-router";
import { ContentDocView } from "@/entities/content-doc";
import { skillPageHref } from "../../../../lib/skill-pages";

export const Route = createFileRoute("/frontend/design-system/components/$slug/$stack/")({
  component: ComponentDocPage,
});

function ComponentDocPage() {
  const { slug, stack } = Route.useParams();
  return (
    <ContentDocView
      menu="frontend/design-system/components"
      slug={slug}
      stack={stack}
      skillHref={skillPageHref}
      back={{ href: "/frontend/design-system/components", label: "컴포넌트 목록으로 돌아가기" }}
      withoutSkill
    />
  );
}

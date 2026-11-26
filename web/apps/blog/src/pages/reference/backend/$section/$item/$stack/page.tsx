import { createFileRoute } from "@tanstack/react-router";
import { ContentDocView } from "@/entities/content-doc";
import { skillPageHref } from "@/pages/lib/skill-pages";
import { ROOT } from "../../../lib/section";

// 묶음 문서: /reference/backend/<묶음>/<문서>/<스택>
export const Route = createFileRoute("/reference/backend/$section/$item/$stack/")({
  component: ReferenceBackendPage,
});

function ReferenceBackendPage() {
  const { section, item, stack } = Route.useParams();
  return (
    <ContentDocView
      menu={`${ROOT}/${section}`}
      section={ROOT}
      slug={item}
      stack={stack}
      skillHref={skillPageHref}
      back={{ href: `/${ROOT}`, label: "Backend Reference 처음으로 돌아가기" }}
    />
  );
}

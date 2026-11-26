import { createFileRoute } from "@tanstack/react-router";
import { ContentDocView, stackRedirect } from "@/entities/content-doc";
import { skillPageHref } from "@/pages/lib/skill-pages";
import { ROOT, STACKS } from "../../lib/section";

// 두 마디 주소: 마지막이 스택이면 섹션 바로 아래 문서(<문서>/<스택>), 아니면 묶음 문서의 스택 없는 주소(<묶음>/<문서>)다.
export const Route = createFileRoute("/reference/frontend/$section/$item/")({
  beforeLoad: ({ params, location }) => {
    if (!STACKS.includes(params.item))
      throw stackRedirect(`${ROOT}/${params.section}`, params.item, location.hash);
  },
  component: ReferenceFrontendTopPage,
});

function ReferenceFrontendTopPage() {
  const { section, item } = Route.useParams();
  return (
    <ContentDocView
      menu={ROOT}
      section={ROOT}
      slug={section}
      stack={item}
      skillHref={skillPageHref}
      back={{ href: `/${ROOT}`, label: "Frontend Reference 처음으로 돌아가기" }}
    />
  );
}

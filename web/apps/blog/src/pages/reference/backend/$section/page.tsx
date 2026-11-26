import { createFileRoute, redirect } from "@tanstack/react-router";
import { stackRedirect } from "@/entities/content-doc";
import { ROOT, firstDocOf, isGroup } from "../lib/section";

// 스택 없는 주소: 섹션 바로 아래 문서는 고른 스택으로, 묶음 이름만 있으면 그 묶음의 첫 문서로 보낸다.
export const Route = createFileRoute("/reference/backend/$section/")({
  beforeLoad: ({ params, location }) => {
    if (isGroup(params.section)) {
      const first = firstDocOf(params.section);
      if (first) throw stackRedirect(first.menu, first.slug);
      throw redirect({ href: `/${ROOT}`, replace: true });
    }
    throw stackRedirect(ROOT, params.section, location.hash);
  },
});

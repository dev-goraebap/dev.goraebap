import { createFileRoute, redirect } from "@tanstack/react-router";
import { stackRedirect } from "@/entities/content-doc";
import { LAYOUT_PAGES } from "@/entities/layout-doc";

// 레이아웃 견본 하나의 예전 주소. 그 레이아웃을 설명하는 지침 글(content)의 문서·절로 보낸다.
export const Route = createFileRoute("/webapp/design-system/layouts/$id/")({
  beforeLoad: ({ params }) => {
    const page = LAYOUT_PAGES[params.id];
    if (!page) throw redirect({ to: "/webapp/design-system/layouts", replace: true });
    throw stackRedirect("design-system", page.slug, page.hash);
  },
});

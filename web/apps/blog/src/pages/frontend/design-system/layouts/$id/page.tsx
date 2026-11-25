import { createFileRoute, redirect } from "@tanstack/react-router";
import { stacksOf, storedStack } from "@/entities/content-doc";
import { LAYOUT_PAGES } from "@/entities/layout-doc";

// 레이아웃 견본 하나의 예전 주소. 그 레이아웃을 설명하는 지침 글(content)의 문서·절로 보낸다.
export const Route = createFileRoute("/frontend/design-system/layouts/$id/")({
  beforeLoad: ({ params }) => {
    const page = LAYOUT_PAGES[params.id];
    if (!page) throw redirect({ to: "/frontend/design-system/layouts", replace: true });
    throw redirect({
      to: "/frontend/design-system/$slug/$stack",
      params: {
        slug: page.slug,
        stack: storedStack("frontend", stacksOf("frontend/design-system")),
      },
      hash: page.hash,
      replace: true,
    });
  },
});

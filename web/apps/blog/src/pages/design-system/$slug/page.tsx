import { createFileRoute } from "@tanstack/react-router";
import { stackRedirect } from "@/entities/content-doc";

// 스택 없는 주소는 고른 적 있는 스택(없으면 첫 스택)의 주소로 보낸다. 절 앵커(#)도 넘긴다.
export const Route = createFileRoute("/design-system/$slug/")({
  beforeLoad: ({ params, location }) => {
    throw stackRedirect("design-system", params.slug, location.hash);
  },
});

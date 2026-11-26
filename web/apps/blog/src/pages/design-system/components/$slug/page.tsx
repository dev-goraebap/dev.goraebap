import { createFileRoute } from "@tanstack/react-router";
import { stackRedirect } from "@/entities/content-doc";

// 스택 없는 컴포넌트 주소는 고른 적 있는 스택(없으면 첫 스택)의 주소로 보낸다.
export const Route = createFileRoute("/design-system/components/$slug/")({
  beforeLoad: ({ params }) => {
    throw stackRedirect("design-system/components", params.slug);
  },
});

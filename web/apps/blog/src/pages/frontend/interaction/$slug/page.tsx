import { createFileRoute, redirect } from "@tanstack/react-router";
import { stacksOf, storedStack } from "@/entities/content-doc";

// 스택 없는 주소는 고른 적 있는 스택(없으면 첫 스택)의 주소로 보낸다.
export const Route = createFileRoute("/frontend/interaction/$slug/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/frontend/interaction/$slug/$stack",
      params: {
        slug: params.slug,
        stack: storedStack("frontend", stacksOf("frontend/interaction")),
      },
      replace: true,
    });
  },
});

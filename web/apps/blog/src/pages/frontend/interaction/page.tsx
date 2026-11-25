import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/frontend/interaction/")({
  beforeLoad: () => {
    throw redirect({
      to: "/frontend/interaction/$slug",
      params: { slug: "overview" },
      replace: true,
    });
  },
});

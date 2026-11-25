import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/frontend/engineering/")({
  beforeLoad: () => {
    throw redirect({
      to: "/frontend/engineering/$slug",
      params: { slug: "overview" },
      replace: true,
    });
  },
});
